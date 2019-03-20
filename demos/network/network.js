!function(){
const VERSION='1.0.4';
const VERSION_ID='1.0.4.0';

const sum=(arr)=>arr.reduce((a,b)=>a+b,0);
const product=(arr)=>arr.reduce((a,b)=>a*b,1);

const PADDING='WW91JTIwYXJlJTIwdG9vJTIweWF1bmclMjB0b28lMjBzaW1wbGUldUZGMENzb21ldGltZXMlMjBuYWl2ZS4lMEE=';
function encode(obj){
	return PADDING+JSON.stringify(obj)
			.split('')
			.map(ch=>String.fromCharCode(33+126-ch.charCodeAt(0)))
			.join('')
		+PADDING;
}
function decode(str){
	return JSON.parse(
		str
			.slice(PADDING.length,-PADDING.length)	
			.split('')
			.map(ch=>String.fromCharCode(33+126-ch.charCodeAt(0)))
			.join('')
	);
}

var gameData;

function printNumber(num){
	const EXP_BASE=10;
	const heads=['','U','D','T','q','Q','s','S','O','N'];
	const tails=['','Dc','Vi','Tg','qg','Qg','sg','Sg','Og','Ng'];
	if(typeof num!=='number')return String(num);
	if(!Number.isFinite(num))return num.toString();
	var [val,exp]=num.toExponential(2).split('e').map(parseFloat);
	if(exp<6){
		if(Number.isSafeInteger(num))return num.toString();
		else return num.toFixed(2);
	}
	val*=Math.pow(10,exp%3);
	var elv=Math.floor(exp/3)-1;
	var suf;
	if(elv<=2){
		suf=['K','M','B'][elv];
	}else if(elv>=EXP_BASE*EXP_BASE){
		return num.toExponential(2);
	}else{
		suf=(heads[elv%EXP_BASE]+tails[Math.floor(elv/EXP_BASE)]).slice(0,2);
	}
	return `${val.toPrecision(3)}${suf}`;
}

const MAX_NAMED_LAYER=4;
const LAYER_NAMES=[
	'结点',
	'链',
	'树',
	'森林',
	'图',
];

function initObj(layer,weight=1){
	var obj={
		weight,
		layer,
		show:true,
		point:1,
	};
	obj.level=1;
	if(layer!==0){
		obj.sons=[initObj(layer-1,weight)];
	}
	return obj;
}

function forEachObj(callback){
	function forEachInObj(obj){
		callback(obj);
		if(obj.layer>0){
			obj.sons.forEach(obj => {
				forEachInObj(obj);
			});
		}
	}
	gameData.arr.forEach(obj => {
		forEachInObj(obj);
	});
}

function calcSum(obj){
	return Math.pow(
		obj.level*(obj.layer===0?
			obj.weight*obj.weight
			:calcArrSum(obj.sons)),
		obj.point
	);
}

function calcArrSum(arr){
	return sum(arr.map(calcSum));
}

function calcGlobalSum(){
	var s=calcArrSum(gameData.arr);
	s+=calcGlobalAdd();
	s*=calcGlobalMult();
	s**=calcGlobalPower();
	return s;
}

function calcPoint(obj){
	const minPro=obj.weight*2+18;
	const valPro=obj.level;
	const rate=4/(Math.pow(obj.layer+2,2));
	return (Math.log(valPro)-Math.log(minPro-1))*rate+1
}

function calcArrPoint(arr){
	return product(arr.map(o=>o.point));
}

const PRICE_INCERASE_RATE=1.44;
const PRICE_INCERASE_RATE_PER_LAYER=0.56;
function upgradeCost(obj){
	return obj.weight
		*Math.pow(1e5,Math.pow(obj.layer,1.6))
		*Math.pow(
			PRICE_INCERASE_RATE+obj.layer*PRICE_INCERASE_RATE_PER_LAYER,
			obj.level-1
		);
}

function upgrade(obj){
	gameData.coin-=upgradeCost(obj);
	obj.level++;
}

const APPEND_COST_MULT=25;
const APPEND_COST_PER_LAYER=1e7;
function addSonCost(arr){
	return APPEND_COST_MULT
		*Math.pow(APPEND_COST_PER_LAYER,arr[0].layer)
		*Math.pow((arr[0].layer+1)*4,arr.length)
		*arr[0].weight;
}

function addSon(arr){
	gameData.coin-=addSonCost(arr);
	arr.push(initObj(arr[0].layer,arr[0].weight*(arr.length+1)));
}

function canToPoint(obj){
	return calcPoint(obj)-obj.point>1e-3;
}

function toPoint(obj){
	gameData.statistics.toPointTimes+=1;
	obj.point=calcPoint(obj);
	obj.level=1;
	if(obj.layer!==0){
		obj.sons=[initObj(obj.layer-1)];
	}
}

function showImproveAreas(){
	return showSkillArea()||showLayerArea();
}

function canToNewSkill(){
	var lastSkill=gameData.skills.length-1;
	if(lastSkill>=gameData.layer)return false;
	return canToSkill(lastSkill+1);
}

const COIN_TO_SKILL=1e6;
const SKILLPOINT_TO_SKILL=1e6;
function canToSkill(id){
	if(id===0){
		return gameData.coin>=COIN_TO_SKILL;
	}else{
		return gameData.skills[id-1].skillPoint>=SKILLPOINT_TO_SKILL;
	}
}

function calcSkillPointGain(id){
	var v=id===0?
		(gameData.coin/COIN_TO_SKILL)-1
		:(gameData.skills[id-1].skillPoint/SKILLPOINT_TO_SKILL)-1;
	return v>=0?Math.sqrt(v):0;
}

function clearNetwork(){
	gameData.coin=0;
	gameData.arr=[initObj(gameData.layer)];
}
function clearSkill(id){
	for(let i=0;i<id;i++){
		gameData.skills[i]=initSkill();
	}
}
function clearSkills(){
	gameData.skills=[];
}
function toSkill(id){
	var st=gameData.statistics.toSkillTimes;
	if(typeof st[id]==='undefined')st[id]=0;
	st[id]+=1;
	gameData.skills[id].skillPoint+=calcSkillPointGain(id);
	clearNetwork();
	clearSkill(id);
}

function showSkillArea(){
	return gameData.skills.length>0;
}

function skillLevelName(id){
	return id<=3?
		('超'.repeat(id)+'转'+(id===0?'生':''))
		:(`超.${id}转`);
}

function skillPointName(id){
	if(id==='-1')return '财富';
	return id<=3?
		('超'.repeat(id)+'技能点')
		:(`超.${id}技能点`);
}

function initSkill(){
	return {
		skillPoint:0,
		coinGen:0,
		globalMult:0,
		globalPower:0,
		toPointMult:0,
		show:true,
	};
}

const SKILLS={
	coinGen:{
		name:'财富获取',
		format:'+VALUE财富/秒',
		effect(lv){
			return 100*lv**3;
		},
		costBase:5,
		costMult:1,
		enable(skillId){
			return skillId===0;
		},
	},
	globalMult:{
		name:'全局加成',
		format:'xVALUE',
		effect(lv){
			return Math.pow(2,lv);
		},
		costBase:2,
		costMult:1,
		enable(skillId){
			return true;
		},
	},
	globalPower:{
		name:'全局指数',
		format:'^VALUE',
		effect(lv){
			return 1+lv*0.01;
		},
		costBase:4,
		costMult:5,
		enable(skillId){
			return skillId>=1;
		},
	},
	// toPointMult:{
	// 	name:'回转加成(无效,请勿购买)',
	// 	format:'xVALUE',
	// 	effect(lv){
	// 		return Math.pow(1.01,lv);
	// 	},
	// 	costBase:3,
	// 	costMult:3,
	// 	enable:2,
	// },
};

function isSkill(skillId){
	return typeof SKILLS[skillId]!=='undefined';
}
function skillName(skillId){
	return SKILLS[skillId].name;
}
function isSkillEnabled(skillId,id){
	return SKILLS[skillId].enable(id);
}
function skillValue(skill,skillId){
	return SKILLS[skillId].effect(skill[skillId]);
}
function skillEffectString(skill,skillId){
	return SKILLS[skillId].format.replace(
		'VALUE',
		printNumber(skillValue(skill,skillId))
	);
}
function skillCost(skill,skillId){
	const skInfo=SKILLS[skillId];
	return skInfo.costMult*Math.pow(skInfo.costBase,skill[skillId]);
}
function canLearnSkill(skill,skillId){
	return skill.skillPoint>=skillCost(skill,skillId);
}
function learnSkill(skill,skillId){
	skill.skillPoint-=skillCost(skill,skillId);
	skill[skillId]++;
}

function calcGlobalAdd(){
	return sum(gameData.skills.map(s=>skillValue(s,'coinGen')));
}

function calcGlobalMult(){
	return product(gameData.skills.map(s=>skillValue(s,'globalMult')));
}

function calcGlobalPower(){
	return product(gameData.skills.map(s=>skillValue(s,'globalPower')));
}

function showLayerArea(){
	return canLayerUp()||canToSkill(gameData.skills.length);
}
function canLayerUp(){
	if(gameData.layer<MAX_NAMED_LAYER){
		return gameData.arr.length>=30;
	}else{
		return false;
	}
}
function layerUpHint(){
	if(gameData.layer<MAX_NAMED_LAYER){
		return `${LAYER_NAMES[gameData.arr[0].layer]}的数量必须不小于${printNumber(30)}`;
	}else{
		return '作者还没做这部分，拿头提升';
	}
}
function layerUp(){
	gameData.layer+=1;
	clearNetwork();
	clearSkills();
}

function newStatistics(){
	return {
		totalTime:0,
		actualTotalTime:0,
		coinEarned:0,
		toPointTimes:0,
		toSkillTimes:{},
	}
}

const TIME_BUILDINGS={
	timeCollector:{
		name:'时间收集器',
		description:'减慢时间流逝，以此收集时间',
		dependOnTime:false,
		cost(lv){
			return 10*Math.pow(lv,2);
		},
		effect(lv){
			return 1-1/(1+lv/10);
		},
		format:'VALUEt',
	},
	timeBurner:{
		name:'燃烧炉',
		description:'以恒定速率燃烧时间，换取加速',
		dependOnTime:true,
		cost(lv){
			return 10*Math.pow(lv,2);
		},
		effect(lv){
			return Math.sqrt(lv/50);
		},
		format:'VALUEt',
	},
	timeRepeator:{
		name:'时空复读机',
		description:'增加燃烧炉的效率(消耗不变)',
		dependOnTime:true,
		cost(lv){
			return 5*Math.pow(lv,2.5);
		},
		effect(lv){
			return Math.log(lv+Math.E);
		},
		format:'xVALUE',
	},
	// timeRecycler:{
	// 	name:'时间回收机',
	// 	description:'回收游戏关闭时从',
	// 	dependOnTime:true,
	// 	cost(lv){
	// 		return 10*Math.pow(lv,2);
	// 	},
	// 	effect(lv){
	// 		return lv*0.1;
	// 	},
	// 	format:'VALUEt',
	// },
};
function timeBuildingEffect(id){
	const ts=gameData.timeStruct;
	return TIME_BUILDINGS[id].effect(ts[id].enable?ts[id].level:0);
}
function timeFlow(){
	return Math.max(
		1-timeBuildingEffect('timeCollector')
			+timeBuildingEffect('timeBurner')*timeBuildingEffect('timeRepeator'),
		0
	);
}
function timeGain(){
	return timeBuildingEffect('timeCollector')
		-timeBuildingEffect('timeBurner');
}
function showTimeStructs(){
	return gameData.layer>=1;
}
function timeBuildingEffectString(id,lv){
	const info=TIME_BUILDINGS[id];
	return info.format.replace(
		'VALUE',
		printNumber(info.effect(lv))
	);
}
function newTimeBuilding(){
	return {
		level:0,
		enable:false,
	};
}
function isTimeBuilding(id){
	return typeof TIME_BUILDINGS[id]!=='undefined';
}
function timeBuildingUpgradeCost(id){
	return TIME_BUILDINGS[id].cost(gameData.timeStruct[id].level+1);
}
function upgradeTimeBuilding(id){
	const ts=gameData.timeStruct;
	ts.time-=timeBuildingUpgradeCost(id);
	ts[id].level+=1;
}
function newTimeStruct(){
	return {
		time:0,
		timeCollector:newTimeBuilding(),
		timeBurner:newTimeBuilding(),
		timeRepeator:newTimeBuilding(),
	};
}

const CONVERT_TIME_MIN=1e15;
function convertTimeHint(){
	return `至少需要${printNumber(CONVERT_TIME_MIN)}财富`;
}
function convertTimeGain(){
	return Math.max(
		(Math.log1p(gameData.coin)-Math.log1p(CONVERT_TIME_MIN))*(1e3/(1e3+gameData.timeStruct.time)),
		0
	);
}
function canConvertTime(){
	return convertTimeGain()>1e-3;
}
function convertTime(){
	gameData.timeStruct.time+=convertTimeGain();
	gameData.coin=0;
}

function newGameData(){
	return {
		version:VERSION,
		versionID:VERSION_ID,
		coin:0,
		arr:[initObj(0)],
		layer:0,
		showSkills:true,
		skills:[],
		statistics:newStatistics(),
		currentTab:'main',
		timeStruct:newTimeStruct(),
	};
}

function fixGameData(gd){
	function fixKey(obj,key,def){
		if(typeof obj[key]==='undefined'){
			obj[key]=def;
		}
	}
	if(typeof gd.versionID==='undefined'){
		fixKey(gd,'version','1.0.2');
		fixKey(gd,'versionID','1.0.2.0');
		fixKey(gd,'coin',0);
		fixKey(gd,'layer',0);
		fixKey(gd,'arr',[initObj(gd.layer)]);
		fixKey(gd,'showSkills',true);
		fixKey(gd,'skills',[]);
		for(let s of gd.skills){
			fixKey(s,'show',true);
			for(let skillId in SKILLS){
				fixKey(s,skillId,0);
			}
		}
	}
	if(gd.versionID<'1.0.3.0'){
		forEachObj(o=>{
			fixKey(o,'level',1);
		});
		gd.versionID='1.0.3.0';
	}
	if(gd.versionID<'1.0.4.0'){
		fixKey(gd,'statistics',newStatistics());
		fixKey(gd,'currentTab','main');
		fixKey(gd,'timeStruct',newTimeStruct());
		for(let key in TIME_BUILDINGS){
			fixKey(gd.timeStruct,key,newTimeBuilding());
		}
		gd.versionID='1.0.4.0';
	}
}

function loadGameData(save){
	var gd;
	this.gameData=gd=decode(save);
	if(typeof gd.versionID==='undefined'||gd.versionID!==VERSION_ID){
		console.log(`存档版本:${gd.version}\n当前版本:${VERSION}`);
		if(typeof gd.versionID==='undefined'||gd.versionID<VERSION_ID){	
			fixGameData(gd);
		}else{
			console.warn('存档版本高于当前版本');
		}
	}
}

const TABS={
	'main':{
		name:'main()',
	},
	'time':{
		name:'时间',
	},
	'stats':{
		name:'统计',
	},
	'save':{
		name:'存档',
	},
};

const CHANGE_LOG={
	'v1.0.4':
`增加了统计功能
支持文本导入导出
增加时间界面
- 在层级1解锁
- 建立时间建筑，影响时间流逝
调整了平衡性
略微改进了界面
修复了回转非结点结构时不重置等级的BUG
`,
	'v1.0.3':
`增加了对非结点结构的升级功能
大幅改进界面
${SKILLS.coinGen.name}现在仅在${skillLevelName(0)}中可用
`,
	'v1.0.2':
`新的技能:${SKILLS.coinGen.name}
- 生成固定的财富收入
- 最低要求:${skillLevelName(0)}
改进了界面
`,
	'v1.0.1':
`增加了层次系统
`,
};

const methods={
	sum,
	product,
	printNumber,
	addSon,
	upgradeCost,
	upgrade,
	toSkill,
	calcSum,
	calcArrPoint,
	calcArrSum,
	calcGlobalMult,
	calcGlobalAdd,
	calcGlobalPower,
	calcGlobalSum,
	calcSkillPointGain,
	calcPoint,
	canLayerUp,
	canLearnSkill,
	canToNewSkill,
	canToPoint,
	canToSkill,
	clearNetwork,
	clearSkill,
	clearSkills,
	toPoint,
	encode,
	decode,
	doGameTick,
	actualTimeFlow,
	addSonCost,
	initObj,
	showImproveAreas,
	initSkill,
	showSkillArea,
	isSkill,
	isSkillEnabled,
	skillValue,
	showLayerArea,
	layerUp,
	layerUpHint,
	learnSkill,
	skillPointName,
	skillName,
	skillCost,
	skillLevelName,
	skillEffectString,
	showTimeStructs,
	isTimeBuilding,
	timeBuildingEffect,
	timeBuildingEffectString,
	timeFlow,
	timeGain,
	newTimeStruct,
	newTimeBuilding,
	convertTime,
	convertTimeGain,
	canConvertTime,
	convertTimeHint,
	timeBuildingUpgradeCost,
	upgradeTimeBuilding,
	forEachObj,
	fixGameData,
	loadGameData,
	newGameData,
	newStatistics,
};

const data={
	get gameData(){
		return gameData;
	},
	set gameData(gd){
		gameData=gd;
	},
	saveStr:'',
	VERSION,
	VERSION_ID,
	LAYER_NAMES,
	SKILLPOINT_TO_SKILL,
	MAX_NAMED_LAYER,
	SKILLS,
	PADDING,
	COIN_TO_SKILL,
	TIME_BUILDINGS,
	APPEND_COST_PER_LAYER,
	CHANGE_LOG,
	TABS,
	LCTCODE:String.raw `#include<bits/stdc++.h>
using namespace std;
#define OK (printf("%s %d OK\n",__FUNCTION__,__LINE__))
const int N=300300;
struct Node{
	typedef Node *np;
	int val,size,x;
	bool rev;
	np ch[2],fa;
	Node(int _val=0){
		val=_val;
		x=val;
		size=1;
		fa=ch[0]=ch[1]=NULL;
		rev=false;
	}
	inline void pd(){
		if(rev){
			if(ch[0])ch[0]->mk();
			if(ch[1])ch[1]->mk();
			rev=false;
		}
	}
	inline bool isr(){
		return !fa||(fa->ch[0]!=this&&fa->ch[1]!=this);
	}
	inline void mk(){
		rev^=1;
		swap(ch[0],ch[1]);
	}
#define sz(p) ((p)?(p)->size:0)
#define X(p) ((p)?(p)->x:0)
	inline void upd(){
		size=sz(ch[0])+1+sz(ch[1]);
		x=X(ch[0])^val^X(ch[1]);
	}
	inline int id(){
		return fa&&fa->ch[0]==this?0:1;
	}
	inline void rot(){
		int d=id();
		np f=fa,g=f->fa,s=ch[1^d];
		if(!f->isr())g->ch[f->id()]=this;
		fa=g;
		f->fa=this;
		ch[1^d]=f;
		f->ch[d]=s;
		if(s)s->fa=f;
		f->upd();
		upd();
	}
	inline void splay(){
		static stack<np> qaq;
		for(np x=this;!x->isr();x=x->fa)qaq.push(x->fa);
		while(!qaq.empty()){
			qaq.top()->pd();
			qaq.pop();
		}
		pd();
		while(!isr()){
			if(fa->fa)(fa->id()==id()?fa:this)->rot();
			rot();
		}
	}
	np lim(int id){
		pd();
		return ch[id]?ch[id]->lim(id):(splay(),this);
	}
	void access(){
		for(np x=this,y=NULL;x;x=x->fa){
			x->splay();
			x->ch[1]=y;
			x->upd();
			y=x;
		}
		splay();
	}
	void mkroot(){
		access();
		mk();
	}
	np findroot(){
		access();
		return lim(0);
	}
	void split(np y){
		mkroot();
		y->access();
	}
	bool link(np y){
		mkroot();
		if(y->findroot()==this)return false;
		fa=y;
		return true;
	}
	bool cut(np y){
		split(y);
		y->pd();
		pd();
		return fa==y&&!ch[0]?(fa=y->ch[1]=NULL,y->upd(),true):false;
	}
};
typedef Node *np;
Node a[N];

void db(np x){
	if(x){
		// x->pd();
		db(x->ch[0]);
#define CD(e) #e"="<<(x->e)<<" "
		// printf("%d ",x->val);
		cerr<<x<<" "<<CD(val)<<CD(fa)<<CD(ch[0])<<CD(ch[1])<<CD(rev)<<CD(x)<<endl;
		db(x->ch[1]);
	}
}
int n,m;
void debug(){
	for(int i=1;i<=n;i++){
		if(a[i].isr()){
			cerr<<"Chain"<<endl;
			db(&a[i]);
		}
	}
}

int main(){
	scanf("%d%d",&n,&m);
	for(int i=1;i<=n;i++){
		int x;
		scanf("%d",&x);
		a[i]=Node(x);
	}
	// debug();
	while(m--){
		int op,x,y;
		scanf("%d%d%d",&op,&x,&y);
		if(op==0){
			a[x].split(&a[y]);
			printf("%d\n",a[y].x);
		}else if(op==1){
			a[x].link(&a[y]);
		}else if(op==2){
			a[x].cut(&a[y]);
		}else if(op==3){
			a[x].splay();
			a[x].val=y;
			a[x].upd();
		}else{
			// DEBUG
			if(op==10){
				cerr<<(a[x].isr()?"Y":"N")<<endl;
			}else if(op==20){
				a[x].access();
			}else if(op==30){
				cerr<<a[x].findroot()<<endl;
			}else if(op==40){
				a[x].mkroot();
			}
		}
		// cerr<<endl;
		// debug();
	}
	return 0;
}`,
};

Vue.component('tab-chooser',{
	props:['tab'],
	methods,
	data(){
		return data;
	},
	template:`
		<button :class="[gameData.currentTab===tab?'btn-active':'btn']" \
@click="gameData.currentTab=tab">{{TABS[tab].name}}</button>
	`,
});

Vue.component('tab-container',{
	props:['tab'],
	methods,
	data(){
		return data;
	},
	template:`
		<div v-if="gameData.currentTab===tab">
			<slot></slot>
		</div>
	`,
});

Vue.component('arr-shower',{
	props:['arr'],
	methods,
	data(){
		return data;
	},
	template:`
		<ul>
			<li v-for="(obj,id) in arr">
				<obj-shower :obj="obj" :id="id">
				</obj-shower>
			</li>
			<button @click="addSon(arr)" class="btn-enabled" :disabled="gameData.coin&lt;addSonCost(arr)">
				增加新的{{LAYER_NAMES[arr[0].layer]}}
			</button>
			<span>{{printNumber(addSonCost(arr))}}财富</span>
		</ul>`,
});

Vue.component('obj-shower',{
	props:['obj','id'],
	methods,
	data(){
		return data;
	},
	template:`
		<div :class="['object','game-item','obj-layer-name-'+obj.layer%(MAX_NAMED_LAYER+1)]">
			<strong>
				<span>
				{{LAYER_NAMES[obj.layer]}}
				</span>
				<span v-if="typeof id!=='undefined'">
					#{{id+1}}
				</span>
			</strong>
			<span>
				{{printNumber(calcSum(obj))}}财富/秒
			</span>
			<button @click="obj.show=!obj.show" class="btn">{{obj.show?'收起':'展示'}}</button>
			<div v-if="obj.show">
				<div>
					<span>{{obj.level}}级<span>
					<button @click="upgrade(obj)" class="btn-enabled" :disabled="gameData.coin&lt;upgradeCost(obj)">
						升级
					</button>
					<span>{{printNumber(upgradeCost(obj))}}财富<span>
				</div>
				<div v-if="obj.point&gt;1||canToPoint(obj)">
					<span>指数:{{obj.point.toFixed(2)}}</span>
					<span v-if="canToPoint(obj)">
						<span class="right-arrow"></span>
						<span>{{calcPoint(obj).toFixed(2)}}</span>
						<button @click="toPoint(obj)" class="btn-warning">回转{{LAYER_NAMES[obj.layer]}}</button>
					</span>
				</div>
				<div v-if="obj.layer!==0">
					<arr-shower :arr="obj.sons"></arr-shower>
				</div>
			</div>
		</div>
	`,
});

function doGameTick(ms){
	const sec=ms/1000;
	var coinGain=calcGlobalSum()*sec;
	gameData.coin+=coinGain;
	gameData.statistics.totalTime+=sec;
	gameData.statistics.coinEarned+=coinGain;
	while(canToNewSkill()){
		gameData.skills.push(initSkill());
	}
	const ts=gameData.timeStruct;
	if(ts.time<=0){
		ts.time=0;
		for(id in ts){
			if(isTimeBuilding(id)&&TIME_BUILDINGS[id].dependOnTime){
				ts[id].enable=false;
			}
		}
	}
}

function hasEvent(ms){
	function check(v,x){
		return v<0&&x-v*ms<0;
	}
	if(check(timeGain(),gameData.timeStruct.time))return true;
	return false;
}

const MIN_TIME_STAMP=1e-8;
function actualTimeFlow(ms){
	if(ms<=MIN_TIME_STAMP||!hasEvent(ms)){
		doGameTick(ms*timeFlow());
		gameData.timeStruct.time+=timeGain()*ms/1000;
	}else{
		var half=ms/2;
		actualTimeFlow(half);
		actualTimeFlow(half);
	}
}

var app=new Vue({
	el:'#app',
	data,
	methods,
	created(){
		var save=localStorage.getItem('game-network-save');
		if(save!=null){
			try{
				this.loadGameData(save);
			}catch(e){
				console.error(e);
				this.gameData=newGameData();
			}finally{
				console.log('存档载入成功');
			}
		}else{
			this.gameData=newGameData();
		}
		var time=(new Date()).getTime();
		this.inv=setInterval(()=>{
			var newTime=(new Date()).getTime();
			var dt=newTime-time;
			this.actualTimeFlow(dt);
			gameData.statistics.actualTotalTime+=dt/1000;
			time=newTime;
			localStorage.setItem('game-network-save',encode(this.gameData));
		});
		console.group('更新记录');
		for(const ver in CHANGE_LOG){
			const el=CHANGE_LOG[ver];
			console.log(`%c${ver}\n%c${el}`,'font-weight:bold','');
		}
		console.groupEnd();
		console.log('加载完毕')
	},
	beforeDestroy(){
		clearInterval(this.inv);
	},
});

// window.debug={
// 	app,
// 	data,
// 	methods,
// };

}();