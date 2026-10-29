'use strict';
const os = require('node:os');
const { getLanIPv4Addresses, isPrivateIPv4 } = require('./network-addresses');
const { qrSvgForUrl } = require('./qr-svg');

function interfaceType(name) {
  const n=String(name).toLowerCase();
  if (/^(lo|docker|veth|br-|virbr|tun|tap|wg|tailscale|zt|podman|cni|flannel|lxc|vboxnet|vmnet)/.test(n)) return null;
  if (/^(wl|wifi|ath\d|ra\d)/.test(n)) return 'wifi';
  if (/^(eth|en|em\d|bond)/.test(n)) return 'ethernet';
  return 'lan';
}

function isValidLocalIPv4(value){
  const parts=String(value||'').split('.');
  return parts.length===4 && parts.every(p=>/^\d{1,3}$/.test(p)&&Number(p)<=255)
    && isPrivateIPv4(value) && !value.startsWith('169.254.') && !value.startsWith('127.');
}

function getStudentAccessLinks({
  networkInterfaces=os.networkInterfaces(), protocol='https', port=3000,
  wifiAccessIp=process.env.INTERLAB_WIFI_ACCESS_IP
}={}) {
  if(!['http','https'].includes(protocol))throw new TypeError('Protocolo no admitido');
  if(!Number.isInteger(Number(port))||Number(port)<1||Number(port)>65535)throw new TypeError('Puerto inválido');
  const ethernet=[],wifi=[],lan=[];
  const seen=new Set();
  function add(kind,address,interfaceName) {
    if(!isValidLocalIPv4(address))return;
    const key=`${kind}:${address}`;
    if(seen.has(key))return;
    seen.add(key);
    const url=`${protocol}://${address}:${port}/alumno`;
    const entry={interfaceName,address,url};
    if(kind==='wifi')entry.qrSvg=qrSvgForUrl(url);
    ({ethernet,wifi,lan})[kind].push(entry);
  }
  for(const {interfaceName,address} of getLanIPv4Addresses(networkInterfaces)) {
    const kind=interfaceType(interfaceName);
    if(kind)add(kind,address,interfaceName);
  }
  // Cuando los móviles utilizan Wi-Fi pero la computadora fija solo Ethernet,
  // el administrador puede indicar una IP del servidor alcanzable desde la WLAN.
  // Es una etiqueta de acceso Wi-Fi, NO activa una nueva interfaz física.
  if(wifiAccessIp && isValidLocalIPv4(wifiAccessIp))add('wifi',wifiAccessIp,'Wi-Fi (acceso mediante LAN)');
  return {ethernet,wifi,lan};
}

module.exports={getStudentAccessLinks,interfaceType,isValidLocalIPv4};
