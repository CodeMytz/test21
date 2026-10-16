const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const Status = { None: 0, Waiting: 1, Active: 2, Finished: 3, Cancelled: 4 };

describe("Reach21 - Sasniedz 21", function () {
  async function deploy() {
    const [alice, bob, carol] = await ethers.getSigners();
    const Reach21 = await ethers.getContractFactory("Reach21");
    const game = await Reach21.deploy();
    await game.waitForDeployment();
    return { game, alice, bob, carol };
  }

  async function activeGame(target = 21) {
    const ctx = await deploy();
    await ctx.game.connect(ctx.alice).createGame(target);
    await ctx.game.connect(ctx.bob).joinGame(1);
    return ctx;
  }

  describe("TEST 1 (pozitivs): divi konti izspele speli lidz uzvarai", function () {
    it("Alise uzvar 21 mērķī, statistika saglabājas", async function () {
      const { game, alice, bob } = await loadFixture(deploy);

      await expect(game.connect(alice).createGame(21))
        .to.emit(game, "GameCreated")
        .withArgs(1, alice.address, 21);
      await expect(game.connect(bob).joinGame(1))
        .to.emit(game, "GameStarted")
        .withArgs(1, alice.address, bob.address, 21);

      const moves = [
        [alice, 3],
        [bob, 3],
        [alice, 3],
        [bob, 3],
        [alice, 3],
        [bob, 3],
        [alice, 3],
      ];
      for (let i = 0; i < moves.length - 1; i++) {
        const [who, amt] = moves[i];
        await game.connect(who).makeMove(1, amt);
      }
      const [lastWho, lastAmt] = moves[moves.length - 1];
      await expect(game.connect(lastWho).makeMove(1, lastAmt))
        .to.emit(game, "MoveMade")
        .withArgs(1, alice.address, 3, 21)
        .and.to.emit(game, "GameFinished")
        .withArgs(1, alice.address, false);

      const g = await game.getGame(1);
      expect(g.status).to.equal(Status.Finished);
      expect(g.winner).to.equal(alice.address);
      expect(g.total).to.equal(21);
      expect(await game.wins(alice.address)).to.equal(1);
      expect(await game.wins(bob.address)).to.equal(0);
      expect(await game.gamesPlayed(alice.address)).to.equal(1);
      expect(await game.gamesPlayed(bob.address)).to.equal(1);
    });

    it("kartas secība mainās pēc katra gājiena", async function () {
      const { game, alice, bob } = await activeGame();
      expect((await game.getGame(1)).turn).to.equal(alice.address);
      await game.connect(alice).makeMove(1, 2);
      expect((await game.getGame(1)).turn).to.equal(bob.address);
      await game.connect(bob).makeMove(1, 1);
      expect((await game.getGame(1)).turn).to.equal(alice.address);
    });

    it("revanšs: jauns mačs saglabā iepriekšējo uzvaru statistiku", async function () {
      const { game, alice, bob } = await activeGame(15);

      for (let i = 0; i < 5; i++) {
        await game.connect(i % 2 === 0 ? alice : bob).makeMove(1, 3);
      }
      expect(await game.wins(alice.address)).to.equal(1);

      await game.connect(bob).createGame(15);
      await game.connect(alice).joinGame(2);
      for (let i = 0; i < 5; i++) {
        await game.connect(i % 2 === 0 ? bob : alice).makeMove(2, 3);
      }
      expect(await game.wins(alice.address)).to.equal(1);
      expect(await game.wins(bob.address)).to.equal(1);
      expect(await game.gamesPlayed(alice.address)).to.equal(2);
      expect(await game.gameCount()).to.equal(2);
    });

    it("getPlayerGames atgriež abu spēlētāju mačus", async function () {
      const { game, alice, bob } = await activeGame();
      expect((await game.getPlayerGames(alice.address)).map(Number)).to.deep.equal([1]);
      expect((await game.getPlayerGames(bob.address)).map(Number)).to.deep.equal([1]);
    });
  });

  describe("TEST 2 (negativs): nepareizais konts meigina veikt gajienu", function () {
    it("Bobs nevar iet Alises kārtā", async function () {
      const { game, bob } = await activeGame();
      await expect(game.connect(bob).makeMove(1, 1)).to.be.revertedWith("Nav tava karta");
    });

    it("trešais konts (nespēlētājs) nevar iet", async function () {
      const { game, carol } = await activeGame();
      await expect(game.connect(carol).makeMove(1, 1)).to.be.revertedWith("Nav tava karta");
    });

    it("nevar iet pirms otrs spēlētājs pievienojies", async function () {
      const { game, alice } = await deploy();
      await game.connect(alice).createGame(21);
      await expect(game.connect(alice).makeMove(1, 1)).to.be.revertedWith("Spele nenotiek");
    });

    it("nevar spēlēt pret sevi", async function () {
      const { game, alice } = await deploy();
      await game.connect(alice).createGame(21);
      await expect(game.connect(alice).joinGame(1)).to.be.revertedWith("Nevar spelet pret sevi");
    });

    it("trešais spēlētājs nevar pievienoties jau aizpildītam macam", async function () {
      const { game, carol } = await activeGame();
      await expect(game.connect(carol).joinGame(1)).to.be.revertedWith("Macam nevar pievienoties");
    });

    it("pēc uzvaras gājienus vairs nevar veikt", async function () {
      const { game, alice, bob } = await activeGame(15);
      for (let i = 0; i < 5; i++) {
        await game.connect(i % 2 === 0 ? alice : bob).makeMove(1, 3);
      }
      await expect(game.connect(bob).makeMove(1, 1)).to.be.revertedWith("Spele nenotiek");
    });
  });

  describe("TEST 3 (negativs): gajiens parsniedz atlauto skaitu vai merki", function () {
    it("0 nav atļauts", async function () {
      const { game, alice } = await activeGame();
      await expect(game.connect(alice).makeMove(1, 0)).to.be.revertedWith("Gajiens jabut 1-3");
    });

    it("4 pārsniedz maksimālo soli", async function () {
      const { game, alice } = await activeGame();
      await expect(game.connect(alice).makeMove(1, 4)).to.be.revertedWith("Gajiens jabut 1-3");
    });

    it("255 (uint8 maksimums) arī tiek noraidīts", async function () {
      const { game, alice } = await activeGame();
      await expect(game.connect(alice).makeMove(1, 255)).to.be.revertedWith("Gajiens jabut 1-3");
    });

    it("gajiens, kas summu pārsniegtu virs mērķa, tiek noraidīts", async function () {
      const { game, alice, bob } = await activeGame(15);

      await game.connect(alice).makeMove(1, 3);
      await game.connect(bob).makeMove(1, 3);
      await game.connect(alice).makeMove(1, 3);
      await game.connect(bob).makeMove(1, 3);
      await game.connect(alice).makeMove(1, 2);

      await expect(game.connect(bob).makeMove(1, 2)).to.be.revertedWith("Parsniedz merki");
      await expect(game.connect(bob).makeMove(1, 3)).to.be.revertedWith("Parsniedz merki");

      await expect(game.connect(bob).makeMove(1, 1)).to.emit(game, "GameFinished");
    });
  });

  describe("Papildu robežgadījumi", function () {
    it("mērķis ārpus 15–31 tiek noraidīts", async function () {
      const { game, alice } = await deploy();
      await expect(game.connect(alice).createGame(14)).to.be.revertedWith("Merkis jabut 15-31");
      await expect(game.connect(alice).createGame(32)).to.be.revertedWith("Merkis jabut 15-31");
      await expect(game.connect(alice).createGame(0)).to.be.revertedWith("Merkis jabut 15-31");
      await expect(game.connect(alice).createGame(15)).to.not.be.reverted;
      await expect(game.connect(alice).createGame(31)).to.not.be.reverted;
    });

    it("neeksistējošs mačs tiek noraidīts", async function () {
      const { game, alice } = await deploy();
      await expect(game.getGame(1)).to.be.revertedWith("Mac neeksiste");
      await expect(game.getGame(0)).to.be.revertedWith("Mac neeksiste");
      await expect(game.connect(alice).joinGame(99)).to.be.revertedWith("Mac neeksiste");
      await expect(game.connect(alice).makeMove(99, 1)).to.be.revertedWith("Mac neeksiste");
    });

    it("izveidotājs var atcelt gaidošu maču, citi nevar", async function () {
      const { game, alice, bob } = await deploy();
      await game.connect(alice).createGame(21);
      await expect(game.connect(bob).cancelGame(1)).to.be.revertedWith("Tikai izveidotajs");
      await expect(game.connect(alice).cancelGame(1)).to.emit(game, "GameCancelled").withArgs(1);
      expect((await game.getGame(1)).status).to.equal(Status.Cancelled);
      await expect(game.connect(bob).joinGame(1)).to.be.revertedWith("Macam nevar pievienoties");
    });

    it("aktīvu maču atcelt nevar", async function () {
      const { game, alice } = await activeGame();
      await expect(game.connect(alice).cancelGame(1)).to.be.revertedWith("Var atcelt tikai gaidosu macu");
    });

    it("timeout: gaidošais spēlētājs var pieprasīt uzvaru pēc 1 dienas", async function () {
      const { game, alice, bob } = await activeGame();
      await game.connect(alice).makeMove(1, 1);

      await expect(game.connect(bob).claimTimeout(1)).to.be.revertedWith("Tava karta - nevar prasit timeout");

      await expect(game.connect(alice).claimTimeout(1)).to.be.revertedWith("Laiks vel nav beidzies");

      await time.increase(24 * 60 * 60 + 1);
      await expect(game.connect(alice).claimTimeout(1))
        .to.emit(game, "GameFinished")
        .withArgs(1, alice.address, true);
      expect(await game.wins(alice.address)).to.equal(1);
    });

    it("timeout nevar pieprasīt nespēlētājs", async function () {
      const { game, carol } = await activeGame();
      await time.increase(24 * 60 * 60 + 1);
      await expect(game.connect(carol).claimTimeout(1)).to.be.revertedWith("Tu neesi speletajs");
    });

    it("vairāki mači var norisināties vienlaikus un ir neatkarīgi", async function () {
      const { game, alice, bob, carol } = await deploy();
      await game.connect(alice).createGame(21);
      await game.connect(bob).createGame(25);
      await game.connect(carol).joinGame(1);
      await game.connect(alice).joinGame(2);

      await game.connect(alice).makeMove(1, 3);
      await game.connect(bob).makeMove(2, 2);

      expect((await game.getGame(1)).total).to.equal(3);
      expect((await game.getGame(2)).total).to.equal(2);
      expect((await game.getGame(1)).target).to.equal(21);
      expect((await game.getGame(2)).target).to.equal(25);
    });
  });
});
