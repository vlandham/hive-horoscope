import json,sys,statistics as st,collections as C,datetime as D
from zoneinfo import ZoneInfo
d=json.load(open(sys.argv[1]))
S=d['states']; P=[s for s in S if s['game_data']['answers']]
print('states',len(S),'played',len(P),'empty',len(S)-len(P))
W=[w for s in P for w in s['game_data']['answers']]
print('words',len(W),'unique',len(set(W)),'per puzzle mean',round(len(W)/len(P),1),'median',st.median(len(s['game_data']['answers']) for s in P))
ts=[s['timestamp'] for s in P]; tz=ZoneInfo('America/Los_Angeles')
dt=[D.datetime.fromtimestamp(t,tz) for t in ts]
print('span',min(dt).date(),max(dt).date())
print('hour of last save',sorted(C.Counter(x.hour for x in dt).items()))
print('weekday',C.Counter(x.strftime('%a') for x in dt).most_common())
print('ranks',C.Counter(s['game_data'].get('rank') for s in P).most_common())
L=[len(w) for w in W]; print('len mean',round(st.mean(L),2),C.Counter(L).most_common())
first=[s['game_data']['answers'][0] for s in P]
print('first word len mean',round(st.mean(map(len,first)),2),'vs all',round(st.mean(L),2))
print('first words',C.Counter(first).most_common(10))
print('all words top',C.Counter(W).most_common(20))
# inferred pangrams: words with 7 distinct letters
pg=[]; pos=[]
for s in P:
  a=s['game_data']['answers']
  for i,w in enumerate(a):
    if len(set(w))==7: pg.append(w); pos.append(i/ max(1,len(a)-1))
print('pangrams found',len(pg),'avg relative position',round(st.mean(pos),2) if pos else None)
print('longest',sorted(set(W),key=len)[-10:])
# length trend within puzzle: correlation of index vs length
import math
def corr(x,y):
  mx,my=st.mean(x),st.mean(y);sx=math.sqrt(sum((a-mx)**2 for a in x));sy=math.sqrt(sum((b-my)**2 for b in y))
  return sum((a-mx)*(b-my) for a,b in zip(x,y))/(sx*sy) if sx and sy else 0
cs=[corr(list(range(len(a))),[len(w) for w in a]) for a in (s['game_data']['answers'] for s in P) if len(a)>=6]
print('within-puzzle index~length corr mean',round(st.mean(cs),2),'n',len(cs))
# stem chaining: next word extends previous
ch=tot=0
for s in P:
  a=s['game_data']['answers']
  for x,y in zip(a,a[1:]):
    tot+=1
    if y.startswith(x) or x.startswith(y): ch+=1
print('chain rate (next word extends prev)',round(ch/tot,3),ch,tot)
# suffix fondness
suf=C.Counter(w[-3:] for w in W if len(w)>5); print('top suffixes',suf.most_common(6))
