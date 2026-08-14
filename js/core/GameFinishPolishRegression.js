// WorldProject – Regression fuer die letzten Fertigstellungs-/UX-Bausteine.
import { runGameSaveStatusTest } from './GameSaveStatusIntegration.js';
import { runActionFeedbackTest } from './GameActionFeedbackIntegration.js';
import { runGameActionFeedbackBridgeTest } from './GameActionFeedbackBridge.js';
import { runActiveOperationsOverviewTest } from './ActiveOperationsOverview.js';
import { runBusinessReadinessCenterTest } from './BusinessReadinessCenter.js';
import { runHumanReadableStatusTest } from './HumanReadableStatus.js';
import { runRuntimeErrorBoundaryTest } from './GameRuntimeErrorBoundary.js';
import { runBreweryEconomicLoopRegression } from './BreweryEconomicLoopRegression.js';
export function runGameFinishPolishRegression(){const tests=[['Save Status',runGameSaveStatusTest],['Action Feedback',runActionFeedbackTest],['Feedback Bridge',runGameActionFeedbackBridgeTest],['Active Operations',runActiveOperationsOverviewTest],['Business Readiness',runBusinessReadinessCenterTest],['Human Status',runHumanReadableStatusTest],['Runtime Error Boundary',runRuntimeErrorBoundaryTest],['Brewery Economic Loop',runBreweryEconomicLoopRegression]],checks=[];for(const[name,fn]of tests){try{const value=fn();checks.push({name,success:value===true||value?.success===true,value});}catch(error){checks.push({name,success:false,error:error?.message||String(error)});}}const failed=checks.filter(x=>!x.success),result={success:failed.length===0,total:checks.length,passed:checks.length-failed.length,failed,checks};console[result.success?'log':'error'](`WORLDPROJECT FINISH-POLISH ${result.passed}/${result.total}`,result);window.worldFinishPolishRegression=result;return result;}
if(typeof window!=='undefined')setTimeout(()=>runGameFinishPolishRegression(),0);
