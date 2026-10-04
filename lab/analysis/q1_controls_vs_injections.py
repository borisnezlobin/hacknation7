import sys, json, numpy as np
sys.path.insert(0,'pipelines')
import baseline
from astropy.timeseries import BoxLeastSquares
from planetlab import lightcurves
from planetlab.datasets import read_split
from planetlab.injection import plan_injection, inject
from planetlab.matching import Truth, signal_matches
from concurrent.futures import ProcessPoolExecutor
def feats(time,flux):
    fl=baseline.detrend(time,flux)
    m=BoxLeastSquares(time,fl)
    r=m.autopower(baseline.DURATIONS_DAYS,minimum_period=0.5,maximum_period=14,frequency_factor=1.0,objective='snr')
    # recompute with likelihood like baseline
    r2=m.autopower(baseline.DURATIONS_DAYS,minimum_period=0.5,maximum_period=14,frequency_factor=1.0)
    b=int(np.argmax(r2.power)); pw=r2.power
    sde=(pw.max()-pw.mean())/pw.std()
    snr=r2.depth_snr[b]
    # robust noise
    mad=1.4826*np.median(np.abs(fl-np.median(fl)))
    ntr=np.sum(m.transit_mask(time,r2.period[b],r2.duration[b],r2.transit_time[b]))
    npts_per_tr=r2.duration[b]/np.median(np.diff(time))
    dsnr_mad=r2.depth[b]/mad*np.sqrt(max(ntr,1))
    ntransits=len(np.unique(np.round((time[m.transit_mask(time,r2.period[b],r2.duration[b],r2.transit_time[b])]-r2.transit_time[b])/r2.period[b])))
    # SDE of snr objective
    b3=int(np.argmax(r.power)); sde_snr=(r.power.max()-np.median(r.power))/(1.4826*np.median(np.abs(r.power-np.median(r.power))))
    gaps=np.sum(np.diff(time)>0.5)
    return dict(P=float(r2.period[b]),t0=float(r2.transit_time[b]),dur=float(r2.duration[b]),depth=float(r2.depth[b]),
        sde=float(sde),depth_snr=float(snr),dsnr_mad=float(dsnr_mad),ntransits=int(ntransits),sde_robust_snrobj=float(sde_snr),
        mad_ppm=float(mad*1e6),gaps=int(gaps),span=float(np.ptp(time)),npts=len(time),
        min_flux_dev=float((1-fl.min())*1e6), n_out5=int(np.sum(fl<1-5*mad)))
def job(a):
    tic,sec,role=a
    c=lightcurves.load(tic,sec); f=c.flux
    if role=='injected':
        tr=plan_injection(tic,c.time); f=inject(c.time,f,tr)
    d=feats(c.time,f); d.update(tic=tic,role=role)
    if role=='injected':
        d['match']=signal_matches(dict(period=d['P'],t0=d['t0'],duration=d['dur']),Truth(tr.period,tr.epoch_btjd,tr.duration_days,tr.depth_ppm)); d['true_depth']=tr.depth_ppm
    return d
if __name__=="__main__":
    C=read_split("dev_controls")
    rng=np.random.default_rng(0); idx=rng.choice(len(C),int(sys.argv[1]),replace=False)
    jobs=[(C[i].tic,C[i].sector,'control') for i in idx]+[(C[i].tic,C[i].sector,'injected') for i in idx]
    with ProcessPoolExecutor(10) as ex:
        out=list(ex.map(job,jobs))
    json.dump(out,open('/tmp/diag2.json','w'))
    print(len(out))
