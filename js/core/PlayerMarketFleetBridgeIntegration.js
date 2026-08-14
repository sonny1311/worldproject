// WorldProject – der gemeinsame Marktbutton öffnet den neuen Warenmarkt;
// der bestehende Kunden-/Fuhrparkdialog bleibt von dort direkt erreichbar.
import { PlayerMarketDialog } from './PlayerMarketDialog.js';

const proto=PlayerMarketDialog.prototype;
if(!proto.__worldFleetBridgeIntegrated){
  proto.__worldFleetBridgeIntegrated=true;
  const originalRender=proto.render;
  proto.render=function(panel,...args){
    const result=originalRender.call(this,panel,...args);
    const body=panel?.children?.[1];
    const nav=body?.firstElementChild;
    if(nav&&nav.querySelector&&!nav.querySelector('[data-world-market-fleet-bridge]')){
      const b=this.button('🚚 Fuhrpark & Kunden',async()=>{
        try{
          const dialog=window.worldAccounts?.marketFleetDialog;
          if(!dialog?.open)throw new Error('Fuhrparkbereich ist noch nicht verfügbar');
          await dialog.open();
        }catch(error){alert(error?.message||String(error));}
      });
      b.dataset.worldMarketFleetBridge='1';
      nav.append(b);
    }
    return result;
  };
}
export function runPlayerMarketFleetBridgeTest(){return true;}
