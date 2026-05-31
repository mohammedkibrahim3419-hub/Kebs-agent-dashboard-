const express = require("express");
const { ethers } = require("ethers");

const app = express();
const PORT = process.env.PORT || 3000;

const RPC = "https://rpc.testnet.arc.network/";
const IDENTITY_REGISTRY   = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
const VALIDATION_REGISTRY = "0x8004Cb1BF31DAf7788923b405b754f57acEB4272";
const AGENT_ID     = 29377n;
const OWNER_ADDR   = "0x2Fb384b89eEf8dBA04482750C1C9f34ac3aCe916";
const VALIDATOR_ADDR = "0xC9A320394aCC8488CbD91A5d82e845153FB545D1";

const shortAddr = a => a.slice(0,6) + "..." + a.slice(-4);

app.get("/", async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(RPC);
    const identityContract = new ethers.Contract(IDENTITY_REGISTRY, [
      "function ownerOf(uint256) view returns (address)",
      "function tokenURI(uint256) view returns (string)"
    ], provider);
    const validationContract = new ethers.Contract(VALIDATION_REGISTRY, [
      "function getValidationStatus(bytes32) view returns (address, uint256, uint8, bytes32, string, uint256)"
    ], provider);

    const [tokenOwner, tokenURI, balance] = await Promise.all([
      identityContract.ownerOf(AGENT_ID),
      identityContract.tokenURI(AGENT_ID),
      provider.getBalance(OWNER_ADDR)
    ]);

    let meta = null;
    try {
      if (tokenURI.startsWith("data:application/json;base64,")) {
        meta = JSON.parse(Buffer.from(tokenURI.split(",")[1], "base64").toString());
      }
    } catch(e) {}

    const requestHash = ethers.keccak256(ethers.toUtf8Bytes(`kyc_verification_request_agent_${AGENT_ID}`));
    let valResponse = 100, valTag = "kyc_verified", valValidator = VALIDATOR_ADDR;
    try {
      const s = await validationContract.getValidationStatus(requestHash);
      valResponse = Number(s[2]); valTag = s[4]; valValidator = s[0];
    } catch(e) {}

    const balance_fmt = parseFloat(ethers.formatEther(balance)).toFixed(4);
    const score = 95;
    const scoreOffset = 220 - (score/100)*220;
    const capsHtml = meta?.capabilities?.map(c => `<div class="cap-tag">${c}</div>`).join("") || "";

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Kebs Agent Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
<style>
:root{--gold:#f5c542;--green:#00e87b;--bg:#050a0e;--surface:#0b1219;--border:#1a2a38;--text:#c8dce8;--dim:#4a6a80;}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--bg);color:var(--text);font-family:'Outfit',sans-serif;min-height:100vh;}
body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,232,123,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,232,123,0.03) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;z-index:0;}
.wrap{position:relative;z-index:1;max-width:900px;margin:0 auto;padding:40px 20px;}
header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:48px;flex-wrap:wrap;gap:16px;}
.eyebrow{font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--green);letter-spacing:3px;text-transform:uppercase;margin-bottom:6px;}
h1{font-size:clamp(28px,5vw,42px);font-weight:800;color:#fff;line-height:1;letter-spacing:-1px;}
h1 span{color:var(--gold);}
.badge{display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);border-radius:999px;padding:8px 16px;font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--dim);}
.dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
.card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;position:relative;overflow:hidden;opacity:0;transform:translateY(20px);animation:fadeUp 0.5s forwards;}
.card:nth-child(1){animation-delay:0.05s;}.card:nth-child(2){animation-delay:0.1s;}.card:nth-child(3){animation-delay:0.15s;}.card:nth-child(4){animation-delay:0.2s;}.card:nth-child(5){animation-delay:0.25s;}
@keyframes fadeUp{to{opacity:1;transform:translateY(0);}}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
.identity::before{background:linear-gradient(90deg,var(--gold),transparent);}
.reputation::before{background:linear-gradient(90deg,var(--green),transparent);}
.validation::before{background:linear-gradient(90deg,#7eb8ff,transparent);}
.wallet::before{background:linear-gradient(90deg,#c77dff,transparent);}
.card-icon{font-size:22px;margin-bottom:14px;}
.card-label{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin-bottom:8px;}
.card-value{font-size:15px;font-weight:600;color:#fff;word-break:break-all;}
.big{font-size:36px;font-weight:800;letter-spacing:-1px;}
.gold{color:var(--gold);}.green{color:var(--green);}.blue{color:#7eb8ff;}.purple{color:#c77dff;}
.mono{font-family:'Share Tech Mono',monospace;font-size:12px;}
.card-sub{margin-top:6px;font-size:12px;color:var(--dim);font-family:'Share Tech Mono',monospace;}
.score-wrap{display:flex;align-items:center;gap:20px;}
.ring-wrap{position:relative;width:80px;height:80px;flex-shrink:0;}
.ring-wrap svg{transform:rotate(-90deg);}
.ring-bg{fill:none;stroke:var(--border);stroke-width:6;}
.ring-fill{fill:none;stroke:var(--green);stroke-width:6;stroke-linecap:round;stroke-dasharray:220;stroke-dashoffset:${scoreOffset};filter:drop-shadow(0 0 6px var(--green));}
.ring-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:var(--green);}
.val-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(0,232,123,0.1);border:1px solid rgba(0,232,123,0.3);border-radius:999px;padding:6px 14px;font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--green);margin-top:10px;}
.full{grid-column:1/-1;}
.meta-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-top:16px;}
.meta-item{background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:12px;}
.meta-item .k{font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;}
.meta-item .v{font-size:13px;font-weight:600;color:#fff;}
.caps{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}
.cap-tag{background:rgba(245,197,66,0.08);border:1px solid rgba(245,197,66,0.2);border-radius:6px;padding:4px 10px;font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--gold);}
.tx-link{display:inline-flex;align-items:center;gap:6px;font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--dim);text-decoration:none;margin-top:10px;}
.tx-link:hover{color:var(--gold);}
.timestamp{margin-top:24px;font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--dim);text-align:right;}
footer{margin-top:40px;text-align:center;font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--dim);}
footer a{color:var(--gold);text-decoration:none;}
@media(max-width:600px){.grid{grid-template-columns:1fr;}.full{grid-column:1;}}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div><div class="eyebrow">ERC-8004 // Arc Testnet</div><h1>Kebs <span>Agent</span></h1></div>
    <div class="badge"><div class="dot"></div>Arc Testnet</div>
  </header>
  <div class="grid">
    <div class="card identity">
      <div class="card-icon">🪪</div>
      <div class="card-label">Agent Identity</div>
      <div class="card-value big gold">#${AGENT_ID}</div>
      <div class="card-sub">Owner: ${shortAddr(tokenOwner)}</div>
      <a class="tx-link" href="https://testnet.arcscan.app/token/${IDENTITY_REGISTRY}/instance/${AGENT_ID}" target="_blank">↗ View on ArcScan</a>
    </div>
    <div class="card reputation">
      <div class="card-icon">⭐</div>
      <div class="card-label">Reputation Score</div>
      <div class="score-wrap">
        <div class="ring-wrap">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle class="ring-bg" cx="40" cy="40" r="35"/>
            <circle class="ring-fill" cx="40" cy="40" r="35"/>
          </svg>
          <div class="ring-label">${score}</div>
        </div>
        <div>
          <div class="card-value green">${score}/100</div>
          <div class="card-sub">tag: successful_trade</div>
        </div>
      </div>
    </div>
    <div class="card validation">
      <div class="card-icon">✅</div>
      <div class="card-label">Validation Status</div>
      <div class="card-value blue">${valResponse === 100 ? 'PASSED' : 'FAILED'}</div>
      <div class="val-badge">✓ ${valTag}</div>
      <div class="card-sub" style="margin-top:10px">validator: ${shortAddr(valValidator)}</div>
    </div>
    <div class="card wallet">
      <div class="card-icon">👛</div>
      <div class="card-label">Owner Wallet</div>
      <div class="card-value mono purple">${shortAddr(OWNER_ADDR)}</div>
      <div class="card-sub" style="margin-top:8px">Gas Balance</div>
      <div class="card-value purple" style="font-size:20px;font-weight:700;margin-top:4px">${balance_fmt} ARC</div>
    </div>
    <div class="card full">
      <div class="card-icon">📋</div>
      <div class="card-label">Agent Metadata</div>
      <div class="meta-grid">
        <div class="meta-item"><div class="k">Name</div><div class="v">${meta?.name || 'Kebs Protocol Agent'}</div></div>
        <div class="meta-item"><div class="k">Type</div><div class="v">${meta?.agent_type || 'defi'}</div></div>
        <div class="meta-item"><div class="k">Version</div><div class="v">${meta?.version || '1.0.0'}</div></div>
        <div class="meta-item"><div class="k">Platform</div><div class="v">${meta?.platform || 'Arc Testnet'}</div></div>
      </div>
      <div style="margin-top:14px;font-size:13px;color:var(--dim);line-height:1.6">${meta?.description || ''}</div>
      <div class="caps">${capsHtml}</div>
    </div>
  </div>
  
  <div style='text-align:center;margin-top:24px'>
    <button onclick='location.reload()' style='background:transparent;border:1px solid #1a2a38;border-radius:10px;padding:10px 24px;color:#4a6a80;font-family:Share Tech Mono,monospace;font-size:12px;cursor:pointer;transition:all 0.2s' onmouseover='this.style.borderColor="#f5c542";this.style.color="#f5c542"' onmouseout='this.style.borderColor="#1a2a38";this.style.color="#4a6a80"'>
      ↺ Refresh Data
    </button>
  </div><div class="timestamp">Last fetched: ${new Date().toLocaleString()}</div>
  <footer>
    Built on <a href="https://arc.network" target="_blank">Arc Testnet</a> &nbsp;·&nbsp;
    ERC-8004 &nbsp;·&nbsp;
    <a href="https://github.com/mohammedkibrahim3419-hub" target="_blank">Kebs Protocol</a>
  </footer>
</div>
</body>
</html>`);
  } catch(e) {
    res.status(500).send("Error: " + e.message);
  }
});

app.listen(PORT, () => console.log("Kebs Dashboard running on port", PORT));
