using Neo;
using Neo.Network.P2P.Payloads;
using Neo.SmartContract.Testing.TestingStandards;

namespace MyToken.Tests;

[TestClass]
public class MyTokenTests : TestBase<Neo.SmartContract.Testing.MyToken>
{
    public MyTokenTests() : base(Neo.SmartContract.Testing.MyToken.Nef, Neo.SmartContract.Testing.MyToken.Manifest)
    {
    }

    [TestMethod]
    public void TestThatOwnerIsCorrect()
    {
        var owner = Contract.Owner;

        Assert.AreEqual("0x0000000000000000000000000000000000000000", owner);
    }

    [TestMethod]
    public void TestThatTestUserBalanceIsZero()
    {
        var testUser = new Signer()
        {
            Account = UInt160.Parse("0x1122334400000000000000000000000000000000"),
            Scopes = WitnessScope.Global,
        };
        
        var balance = Contract.BalanceOf(testUser.Account);
        
        Assert.AreEqual(0, balance);
    }
}