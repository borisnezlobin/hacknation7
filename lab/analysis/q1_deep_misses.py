import sys, json, numpy as np
sys.path.insert(0,'pipelines')
import baseline
from planetlab import lightcurves
from planetlab.datasets import read_split
from planetlab.matching import Truth, signal_matches
from concurrent.futures import ProcessPoolExecutor
P={t.tic:t for t in read_split("dev_planets")}
tics=[309845124,111778581,115018003,437346961,31061885,347866089,12999193,60091800]
def run(tic):
    t=P[tic]; c=lightcurves.load(tic,t.sector)
    sig=baseline.search(c.time,c.flux)
    tr=Truth(t.period,t.epoch_btjd,t.duration_days,t.depth_ppm)
    # expected epoch drift: number of cycles from catalog epoch to data
    n=(c.time.mean()-t.epoch_btjd)/t.period
    fl=baseline.detrend(c.time,c.flux)
    ph=((c.time-t.epoch_btjd+0.5*t.period)%t.period)-0.5*t.period
    intr=np.abs(ph)<0.5*t.duration_days
    return dict(tic=tic,P=round(t.period,4),dur_h=round(t.duration_days*24,2),depth=round(t.depth_ppm),ncyc=round(n),
      span=round(np.ptp(c.time),1),npts=len(c.time),
      raw_dip_at_catalog_ephem=round((1-np.median(c.flux[intr]))*1e6) if intr.any() else None,
      detr_dip=round((1-np.median(fl[intr]))*1e6) if intr.any() else None,
      sigs=[(round(s['period'],4),round(s['t0'],3),round(s['duration'],3),round(s['depth']*1e6),round(s['score'],1),
             signal_matches({k:float(v) for k,v in s.items()},tr)) for s in sig])
if __name__=="__main__":
  with ProcessPoolExecutor(8) as ex:
    for r in ex.map(run,tics): print(json.dumps(r))
