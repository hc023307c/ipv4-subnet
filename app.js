function parseIp(ipStr) {
  const parts = ipStr.trim().split(".");
  if (parts.length !== 4) return null;

  const bytes = parts.map((p) => Number(p));
  for (const b of bytes) {
    if (!Number.isInteger(b) || b < 0 || b > 255) {
      return null;
    }
  }
  return bytes;
}

function ipToInt(bytes) {
  return (
    (bytes[0] << 24) |
    (bytes[1] << 16) |
    (bytes[2] << 8) |
    bytes[3]
  ) >>> 0; // >>>0 轉成 unsigned 32-bit
}

function intToIp(num) {
  return [
    (num >>> 24) & 0xff,
    (num >>> 16) & 0xff,
    (num >>> 8) & 0xff,
    num & 0xff,
  ].join(".");
}

function prefixToMask(prefix) {
  if (prefix < 0 || prefix > 32) return null;
  const maskInt =
    prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return {
    int: maskInt,
    dotted: intToIp(maskInt),
  };
}

function calcSubnet(ipStr, prefixStr) {
  const ipBytes = parseIp(ipStr);
  if (!ipBytes) {
    throw new Error("IP 位址格式錯誤，請輸入合法的 IPv4，例如 192.168.1.10");
  }

  const prefix = Number(prefixStr);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    throw new Error("首碼必須是 0~32 的整數");
  }

  const ipInt = ipToInt(ipBytes);
  const mask = prefixToMask(prefix);
  if (!mask) {
    throw new Error("首碼無效");
  }

  const networkInt = (ipInt & mask.int) >>> 0;
  const broadcastInt =
    (networkInt | (~mask.int >>> 0)) >>> 0;

  const networkIp = intToIp(networkInt);
  const broadcastIp = intToIp(broadcastInt);

  const blockRange = `${networkIp}  ~  ${broadcastIp}`;

  // 可用 IP 範圍判斷（/31, /32 特例）
  let hostRangeText = "";
  if (prefix === 32) {
    hostRangeText = `單一主機網段：只有 ${networkIp} 可用`;
  } else if (prefix === 31) {
    const first = networkInt;
    const second = broadcastInt;
    hostRangeText = `/31 點對點網段：${intToIp(first)} 與 ${intToIp(
      second
    )} 皆可用`;
  } else {
    const firstHostInt = networkInt + 1;
    const lastHostInt = broadcastInt - 1;
    hostRangeText = `${intToIp(firstHostInt)}  ~  ${intToIp(
      lastHostInt
    )}`;
  }

  return {
    cidrName: `${networkIp}/${prefix}`,
    subnetMask: mask.dotted,
    networkAddress: networkIp,
    broadcastAddress: broadcastIp,
    blockRange,
    hostRange: hostRangeText,
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const ipInput = document.getElementById("ipInput");
  const prefixInput = document.getElementById("prefixInput");
  const calcBtn = document.getElementById("calcBtn");
  const errorMsg = document.getElementById("errorMsg");
  const resultSection = document.getElementById("resultSection");

  const cidrNameEl = document.getElementById("cidrName");
  const subnetMaskEl = document.getElementById("subnetMask");
  const networkAddressEl = document.getElementById("networkAddress");
  const broadcastAddressEl =
    document.getElementById("broadcastAddress");
  const blockRangeEl = document.getElementById("blockRange");
  const hostRangeEl = document.getElementById("hostRange");

  calcBtn.addEventListener("click", () => {
    errorMsg.textContent = "";
    resultSection.classList.add("hidden");

    try {
      const result = calcSubnet(
        ipInput.value,
        prefixInput.value
      );

      cidrNameEl.textContent = result.cidrName;
      subnetMaskEl.textContent = result.subnetMask;
      networkAddressEl.textContent = result.networkAddress;
      broadcastAddressEl.textContent = result.broadcastAddress;
      blockRangeEl.textContent = result.blockRange;
      hostRangeEl.textContent = result.hostRange;

      resultSection.classList.remove("hidden");
    } catch (err) {
      errorMsg.textContent = err.message;
    }
  });
});
