/** @constant {Array} loc lat,lng */
const locs = ["116.834103,39.941821", "116.672327,39.932129"];
const heWeatherKey = "AAAAAAAAAAAAAAAAAAAAAAAA";
const aqicnKey = "BBBBBBBBBBBBBBBBBBBBBBBBBBBB";
const type = ["now", "forecast", "lifestyle", "hourly"];

const $ = init("heWeather");

const lifeStyle = {
  //此处用于显示各项生活指数，可自行调整顺序，顺序越在前面则显示也会靠前，如果您不想查看某一指数，置为false即可，想看置为true即可
  drsg: true, //穿衣指数,
  flu: true, //感冒指数,
  comf: true, //舒适度指数,
  cw: false, //洗车指数,
  sport: false, //运动指数,
  trav: false, //旅游指数,
  uv: false, //紫外线指数,
  air: false, //空气污染扩散条件指数,
  ac: false, //空调开启指数,
  ag: false, //过敏指数,
  gl: false, //太阳镜指数,
  mu: false, //化妆指数,
  airc: false, //晾晒指数,
  ptfc: false, //交通指数,
  fsh: false, //钓鱼指数,
  spi: false //防晒指数
};
const lifeProps = {
  drsg: { icon: "👔", name: "穿衣指数" },
  flu: { icon: "🤧", name: "感冒指数" },
  comf: { icon: "😊", name: "舒适度指数" },
  cw: { icon: "🚗", name: "洗车指数" },
  sport: { icon: "🏃🏻", name: "运动指数" },
  trav: { icon: "🌴", name: "旅游指数" },
  uv: { icon: "☂️", name: "紫外线指数" },
  air: { icon: "🌫", name: "空气污染扩散条件指数" },
  ac: { icon: "❄️", name: "空调开启指数" },
  ag: { icon: "😷", name: "过敏指数" },
  gl: { icon: "🕶", name: "太阳镜指数" },
  mu: { icon: "💄", name: "化妆指数" },
  airc: { icon: "🧺", name: "晾晒指数" },
  ptfc: { icon: "🚥", name: "交通指数" },
  fsh: { icon: "🎣", name: "钓鱼指数" },
  spi: { icon: "🔆", name: "防晒指数" }
};

/**
 * @param {string} loc the location to get weather info
 * @param {number} i target info type from array 'type'
 */
async function getHeWeatherInfo(loc = "auto_ip", i) {
  return new Promise((resolve, reject) => {
    const url = `https://free-api.heweather.net/s6/weather/${type[i]}?key=${heWeatherKey}&location=${loc}`;
    $.get(url, (err, resp, data) => {
      if (!err && resp && resp.status === 200) {
        const info = $.toObj(data).HeWeather6;
        if (info[0].status == "ok") resolve(info[0]);
        else reject(info[0].status);
      } else reject(`HTTP 请求失败`);
    });
  });
}

async function getAqicnInfo(loc) {
  return new Promise((resolve, reject) => {
    loc = loc.split(",").reverse().join(";");
    const url = `https://api.waqi.info/feed/geo:${loc}/?token=${aqicnKey}`;
    $.get(url, (err, resp, data) => {
      if (!err && resp && resp.status === 200) {
        const { status, data: info } = JSON.parse(data);
        status == "ok"
          ? resolve({
              main: parseAqicnInfo(info.aqi),
              location: info.city.name
            })
          : reject(info);
      } else reject(`HTTP 请求失败`);
    });
  });
}

function parseWeather(code) {
  const map = {
    _100: { emoji: "☀️", name: "晴" },
    _101: { emoji: "☁️", name: "多云" },
    _102: { emoji: "☁️", name: "少云" },
    _103: { emoji: "⛅️", name: "晴间多云" },
    _104: { emoji: "☁️", name: "阴" },
    _200: { emoji: "💨", name: "有风" },
    _201: { emoji: "🌬", name: "平静" },
    _202: { emoji: "🌬", name: "微风" },
    _203: { emoji: "🌬", name: "和风" },
    _204: { emoji: "🌬", name: "清风" },
    _205: { emoji: "🌬", name: "强风" },
    _206: { emoji: "💨", name: "疾风" },
    _207: { emoji: "💨", name: "大风" },
    _208: { emoji: "💨", name: "烈风" },
    _209: { emoji: "🌪", name: "风暴" },
    _210: { emoji: "🌪", name: "狂爆风" },
    _211: { emoji: "🌪", name: "飓风" },
    _212: { emoji: "🌪", name: "龙卷风" },
    _213: { emoji: "🌪", name: "热带风暴" },
    _300: { emoji: "🌨", name: "阵雨" },
    _301: { emoji: "🌨", name: "强阵雨" },
    _302: { emoji: "⛈", name: "雷阵雨" },
    _303: { emoji: "⛈", name: "强雷阵雨" },
    _304: { emoji: "⛈", name: "雷阵雨伴冰雹" },
    _305: { emoji: "💧", name: "小雨" },
    _306: { emoji: "💦", name: "中雨" },
    _307: { emoji: "🌧", name: "大雨" },
    _308: { emoji: "🌧", name: "极端降雨" },
    _309: { emoji: "☔️", name: "毛毛雨" },
    _310: { emoji: "🌧", name: "暴雨" },
    _311: { emoji: "🌧", name: "大暴雨" },
    _312: { emoji: "🌧", name: "特大暴雨" },
    _313: { emoji: "🌨", name: "冻雨" },
    _314: { emoji: "💧", name: "小到中雨" },
    _315: { emoji: "💦", name: "中到大雨" },
    _316: { emoji: "🌧", name: "大到暴雨" },
    _317: { emoji: "🌧", name: "暴雨到大暴雨" },
    _318: { emoji: "🌧", name: "大暴雨到特大暴雨" },
    _399: { emoji: "🌧", name: "雨" },
    _400: { emoji: "🌨", name: "小雪" },
    _401: { emoji: "🌨", name: "中雪" },
    _402: { emoji: "☃️", name: "大雪" },
    _403: { emoji: "❄️", name: "暴雪" },
    _404: { emoji: "🌨", name: "雨夹雪" },
    _405: { emoji: "🌨", name: "雨雪天气" },
    _406: { emoji: "🌨", name: "阵雨夹雪" },
    _407: { emoji: "🌨", name: "阵雪" },
    _408: { emoji: "🌨", name: "小到中雪" },
    _409: { emoji: "🌨", name: "中到大雪" },
    _410: { emoji: "❄️", name: "大到暴雪" },
    _499: { emoji: "☃️", name: "雪" },
    _500: { emoji: "🌫", name: "薄雾" },
    _501: { emoji: "🌫", name: "雾" },
    _502: { emoji: "🌫", name: "霾" },
    _503: { emoji: "🌫", name: "扬沙" },
    _504: { emoji: "🌫", name: "浮尘" },
    _507: { emoji: "🌫", name: "沙尘暴" },
    _508: { emoji: "🌫", name: "强沙尘暴" },
    _509: { emoji: "🌫", name: "浓雾" },
    _510: { emoji: "🌫", name: "强浓雾" },
    _511: { emoji: "🌫", name: "中度霾" },
    _512: { emoji: "🌫", name: "重度霾" },
    _513: { emoji: "🌫", name: "严重霾" },
    _514: { emoji: "🌫", name: "大雾" },
    _515: { emoji: "🌫", name: "特强浓雾" },
    _900: { emoji: "🔥", name: "热" },
    _901: { emoji: "⛄️", name: "冷" },
    _999: { emoji: "❓", name: "未知" }
  };
  const { emoji, name } = map[`_${code}`] || map["_999"];
  return `${emoji} ${name} `;
}

function parseAqicnInfo(aqi) {
  const icon = ["😎", "😌", "😢", "🤭", "😡", "🤬"];
  const desc = ["优", "良好", "轻度污染", "中度污染", "重度污染", "严重污染"];
  /* const warn = [
            null,
            "极少数敏感人群应减少户外活动",
            "老人、儿童、呼吸系统等疾病患者减少长时间、高强度的户外活动",
            "儿童、老人、呼吸系统等疾病患者及一般人群减少户外活动",
            "儿童、老人、呼吸系统等疾病患者及一般人群停止或减少户外运动",
            "儿童、老人、呼吸系统等疾病患者及一般人群停止户外活动"
        ] */
  const i = aqi > 300 ? 5 : aqi > 200 ? 4 : parseInt(aqi / 50);
  return `${icon[i]} 空气质量 ${aqi}(${desc[i]})\n`;
}

function parseUvindex(uvIndex) {
  let uvDesc;
  if (uvIndex >= 10) {
    uvDesc = "五级-特别强";
  } else if (uvIndex >= 7) {
    uvDesc = "四级-很强";
  } else if (uvIndex >= 5) {
    uvDesc = "三级-较强";
  } else if (uvIndex >= 3) {
    uvDesc = "二级-较弱";
  } else {
    uvDesc = "一级-最弱";
  }
  return `🌞 紫外线指数 ${uvIndex}(${uvDesc})`;
}

function parseNow(data) {
  const { wind_spd, wind_dir, hum, pres, fl, cond_code, tmp, vis } = data.now;
  const detail_pre = `🍃 风速 ${wind_spd}km/h ${wind_dir} 🌡 体感温度 ${fl}℃\n💨 气压 ${pres}hPa 💧 相对湿度 ${hum}%\n👀 能见度 ${vis}km `;
  const subtitile_pre = `${parseWeather(cond_code)} `;
  const location = data.basic.location;
  return { detail_pre, subtitile_pre, spare: tmp, location };
}

function parseLifeStyle(data) {
  let result = [];
  for (let index of data.lifestyle) {
    const { type, brf, txt } = index;
    if (!lifeStyle[type]) continue;
    const { icon, name } = lifeProps[type];
    result.push(`${icon} ${name}：${brf} | ${txt}`);
  }
  const location = data.basic.location;
  let main;
  if (result.length > 0) main = `[生活指数]\n${result.join("\n")}`;
  else main = "[生活指数]\n暂无";
  return { location, main };
}

function parseForecast(data) {
  let result = [];
  let foreInfo = data.daily_forecast;
  for (let i of foreInfo) {
    let { date, hum, tmp_max, tmp_min } = i;
    let { cond_code_n: cn, cond_code_d: cd } = i;
    date = date.split("-").splice(1, 2).join("/");
    const tmp = `${tmp_min}~${tmp_max}℃`;
    result.push(
      `${date} ${tmp} 相对湿度 ${hum}% \nㅤㅤㅤㅤ🌇 ${parseWeather(
        cd
      )}\nㅤㅤㅤㅤ🌃 ${parseWeather(cn)}`
    );
  }
  let { uv_index, pop, tmp_max, tmp_min } = foreInfo[0];
  return {
    forecast: `[天气预报]\n${result.join("\n")}`,
    uv: parseUvindex(uv_index),
    subtitile_sfx: `${tmp_min}~${tmp_max}℃ ☔️降雨概率 ${pop}`,
    location: data.basic.location
  };
}

async function renderBody(loc) {
  let subtitle = "",
    subtitle_bak;
  let prefix = "",
    lifestyle,
    suffix = "";
  let location_my, location_bak;
  try {
    let info = await getHeWeatherInfo(loc, 0);
    let { detail_pre, subtitile_pre, spare, location } = parseNow(info);
    subtitle += subtitile_pre;
    subtitle_bak = spare;
    prefix += detail_pre;
    location_my = location;
  } catch (e) {
    $.log(e);
    prefix += `👴 实时天气数据 获取失败：${e} `;
  }
  try {
    let { main, location } = await getAqicnInfo(loc);
    prefix += main;
    location_bak = location;
  } catch (e) {
    $.log(e);
  }
  try {
    let info = await getHeWeatherInfo(loc, 2);
    let { location, main } = parseLifeStyle(info);
    lifestyle = main;
    if (!location_my) location_my = location;
  } catch (e) {
    $.log(e);
    lifestyle = `[生活指数]\n获取失败：${e}`;
  }
  try {
    let info = await getHeWeatherInfo(loc, 1);
    let { forecast, uv, subtitile_sfx, location } = parseForecast(info);
    prefix += uv;
    subtitle += subtitile_sfx;
    suffix = forecast;
    if (!location_my) location_my = location;
  } catch (e) {
    $.log(e);
    if (subtitle_bak) subtitle += subtitle_bak;
    suffix = `[天气预报]\n获取失败：${e}`;
  }
  const body = [prefix, suffix, lifestyle].join("\n\n");
  return [
    `[天气日报] - ${location_my || location_bak || "地点未知"}`,
    subtitle,
    body
  ];
}

(async () => {
  for (let loc of locs) {
    let params = await renderBody(loc);
    $.msg(...params);
  }
  $.done();
})();

/* Chavyleung's Env.js reimplement version */
/* prettier-ignore */
function init(e,t){return new class{constructor(e,t){this.name=e,this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",Object.assign(this,t)}get isQuanX(){return"undefined"!=typeof $task}get isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}get isLoon(){return"undefined"!=typeof $loon}toObj(e,t=null){try{return JSON.parse(e)}catch(e){return t}}toStr(e,t=null){try{return"number"==typeof e?String(e):JSON.stringify(e)}catch(e){return t}}read(e){let t;return this.isSurge||this.isLoon?t=$persistentStore.read(e):this.isQuanX&&(t=$prefs.valueForKey(e)),this.toObj(t)}write(e,t){return e=this.toStr(e),this.isSurge||this.isLoon?$persistentStore.write(e,t):this.isQuanX?$prefs.setValueForKey(e,t):void 0}get(e,t){(e="string"==typeof e?{url:e}:e).headers&&(delete e.headers["Content-Type"],delete e.headers["Content-Length"]),this.isSurge||this.isLoon?(this.isSurge&&this.isNeedRewrite&&(e.headers=e.headers||{},Object.assign(e.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(e,(e,s,i)=>{!e&&s&&(s.body=i,s.statusCode=s.status),t(e,s,i)})):this.isQuanX&&(this.isNeedRewrite&&(e.opts=e.opts||{},Object.assign(e.opts,{hints:!1})),$task.fetch(e).then(e=>{const{statusCode:s,statusCode:i,headers:r,body:n}=e;t(null,{status:s,statusCode:i,headers:r,body:n},n)},e=>t(e)))}post(e,t){(e="string"==typeof e?{url:e}:e).body&&e.headers&&!e.headers["Content-Type"]&&(e.headers["Content-Type"]="application/x-www-form-urlencoded"),e.headers&&delete e.headers["Content-Length"],this.isSurge||this.isLoon?(this.isSurge&&this.isNeedRewrite&&(e.headers=e.headers||{},Object.assign(e.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(e,(e,s,i)=>{!e&&s&&(s.body=i,s.statusCode=s.status),t(e,s,i)})):this.isQuanX&&(e.method="POST",this.isNeedRewrite&&(e.opts=e.opts||{},Object.assign(e.opts,{hints:!1})),$task.fetch(e).then(e=>{const{statusCode:s,statusCode:i,headers:r,body:n}=e;t(null,{status:s,statusCode:i,headers:r,body:n},n)},e=>t(e)))}time(e,t=null,s=!1){if(!e)return t||(new Date).getTime();const i=t?new Date(t):new Date;let r=s?{"M+":i.getUTCMonth()+1,"d+":i.getUTCDate(),"H+":i.getUTCHours(),"m+":i.getUTCMinutes(),"s+":i.getUTCSeconds(),"q+":Math.floor((i.getUTCMonth()+3)/3),S:i.getUTCMilliseconds()}:{"M+":i.getMonth()+1,"d+":i.getDate(),"H+":i.getHours(),"m+":i.getMinutes(),"s+":i.getSeconds(),"q+":Math.floor((i.getMonth()+3)/3),S:i.getMilliseconds()};/(y+)/.test(e)&&(e=e.replace(RegExp.$1,(i[s?"getUTCFullYear":"getFullYear"]()+"").substr(4-RegExp.$1.length)));for(let t in r)new RegExp("("+t+")").test(e)&&(e=e.replace(RegExp.$1,1==RegExp.$1.length?r[t]:("00"+r[t]).substr((""+r[t]).length)));return e}msg(t=e,s="",i="",r){const n=e=>{if(!e)return e;if("string"==typeof e){if(this.isLoon)return e;if(this.isQuanX)return{"open-url":e};if(this.isSurge)return{url:e}}else{if("object"!=typeof e)return;if(this.isLoon){return{openUrl:e.openUrl||e.url||e["open-url"],mediaUrl:e.mediaUrl||e["media-url"]}}if(this.isQuanX){return{"open-url":e["open-url"]||e.url||e.openUrl,"media-url":e["media-url"]||e.mediaUrl}}if(this.isSurge){return{url:e.url||e.openUrl||e["open-url"]}}}};if(this.isMute||(this.isSurge||this.isLoon?$notification.post(t,s,i,n(r)):this.isQuanX&&$notify(t,s,i,n(r))),!this.isMuteLog){let e=["","==============\u{1f4e3}\u7cfb\u7edf\u901a\u77e5\u{1f4e3}=============="];e.push(t),s&&e.push(s),i&&e.push(i),this.log(...e)}}log(...e){e.length>0&&console.log(e.join(this.logSeparator))}logErr(e){this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,e)}wait(e){return new Promise(t=>setTimeout(t,e))}done(e={}){$done(e)}}(e,t)}
