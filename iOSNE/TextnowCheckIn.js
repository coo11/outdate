"user strict";
const $ = init("TextnowCheckIn");
const customMessage = "";
const retryTimes = 3;
const sendInterval = 7; // For 0 to send right now. Unit: Day
const isTapToOpenApp = false;
const isShowClearTextNumber = false;
const accounts = [
  {
    to: "+13473634546",
    username: "flyn9666",
    number: "+13473634546",
    cookie:
      "connect.sid=s%3AAGG0rjwRf-3o9gjEk9OMGJHownRXrrWp.jrJZIILY4PE97hkXOVN5vaYHKETdLjAchegS1HhePLE"
  },
  {
    to: "+13473634546",
    username: "slm.protype",
    number: "+13473634546",
    cookie:
      "connect.sid=s%3AnuNIr55rqikVJs2BEpcXfGzqgx2OB3rm.y2mPfy%2FQ5BIrWpBn4x6m%2FCP%2Fa3LNdM%2BWuq20VKwpnF8"
  },
  {
    to: "+13473634546",
    username: "u0u83",
    number: "+13473634546",
    cookie:
      "connect.sid=s%3AwpXfFfUk5qyMdITmbC7mk-wywSOE6wDI.IeabCbF4srw8ARMnooUxAIUCSC1I0fswllxmGWh%2FPXA"
  }
];
const ua = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 13_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Mobile/15E148 Safari/604.1",
  "TextNow/20.47.0 (iPhone8,2; iOS 13.6.1; Scale/3.00)"
];

class TNCI {
  constructor(info) {
    this.restRetryTimes = 3;
    this.number = `+${info.number.replace(/^\+/, "")}`;
    this.username = info.username;
    this.cookie = info.cookie;
    this.to = `+${info.to.replace(/^\+/, "")}`;
    /** @member {Object} - The cached message sending Info. value format: timestamp(16)|messageNumberID */
    this.key = `${$.name}${this.number}`;
  }
  get sendMoment() {
    return new Date($.time() - this.randomGenerate(15) * 1e3).toISOString();
  }
  get body() {
    const time = this.sendMoment;
    const message =
      customMessage ||
      `Sending this SMS to prevent current number from being recycled at ${time}.`;
    let json = {
      contact_value: this.to,
      contact_type: 2,
      message: message,
      read: 1,
      message_direction: 2,
      message_type: 1,
      from_name: "me",
      has_video: false,
      new: true,
      date: this.sendMoment
    };
    return `json=${encodeURIComponent($.toStr(json))}`;
  }
  get isTimeToCheck() {
    if (!sendInterval) return true;
    const value = $.read(this.key);
    if (value) {
      const [lastTime, id] = value.split("|");
      const day = (($.time() - lastTime) / 864e5).toFixed(2);
      if (day < sendInterval)
        $.log(
          `账户 ${this.username} 下的号码 ${
            this.number
          } 距离上次签到已过 ${day} 天，距离下次签到还有 ${
            sendInterval - day
          } 天。`
        );
      return day >= sendInterval;
    } else return true;
  }
  randomGenerate(variable) {
    if (Array.isArray(variable)) {
      return variable[Math.round(Math.random() * (variable.length - 1))];
    } else if (typeof variable === "number") {
      return Math.round(Math.random() * variable);
    }
  }
  send() {
    return new Promise((resolve, reject) => {
      $.post(
        {
          url: `https://www.textnow.com/api/users/${this.username}/messages`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": this.randomGenerate(ua),
            Cookie: this.cookie,
            referrer: "https://www.textnow.com/messaging"
          },
          body: this.body
        },
        (err, resp, data) => {
          if (!err && resp && resp.status === 200) {
            $.log(data);
            data = $.toObj(data);
            if ("id" in data && /^\d+$/.test(data.id)) resolve(data.id);
            else if ("error_code" in data) reject(data);
          }
          reject("网络请求错误。");
        }
      );
    });
  }
  async dash() {
    if (!this.isTimeToCheck) return;
    let message,
      numberToShow = isShowClearTextNumber
        ? `号码 ${this.number} `
        : `尾号为 ${this.number.slice(-4)} 的号码`;
    try {
      const id = await this.send();
      message = `${numberToShow}续命成功, 已发送消息 ID 为 ${id}。🎈`;
      $.write(`${$.time()}|${id}`, this.key);
    } catch (e) {
      if (typeof e === "string") {
        if (!this.restRetryTimes) message = `${numberToShow}续命失败，${e}⛔`;
        else {
          this.restRetryTimes--;
          return await this.dash();
        }
      }
      if (typeof e === "object" && "error_code" in e) {
        message = `${numberToShow}续命失败，错误消息：${e}。💥`;
      }
    }
    const n = retryTimes - this.restRetryTimes,
      suffix = n ? ` (已重试 ${n} 次)` : "";
    return $.msg(
      "TextNow - 定期发送消息",
      `账户 ${this.username} ${suffix}`,
      message,
      {
        openUrl: isTapToOpenApp
          ? "textnow://"
          : "https://www.textnow.com/messaging",
        mediaUrl: "https://www.textnow.com/favicon/apple-icon.png"
      }
    );
  }
}

(async () => {
  for (let account of accounts) {
    const mission = new TNCI(account);
    await mission.dash();
  }
  $.done();
})();

/* Chavyleung's Env.js reimplement version */
/* prettier-ignore */
function init(e,t){return new class{constructor(e,t){this.name=e,this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",Object.assign(this,t)}get isQuanX(){return"undefined"!=typeof $task}get isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}get isLoon(){return"undefined"!=typeof $loon}toObj(e,t=null){try{return JSON.parse(e)}catch(e){return t}}toStr(e,t=null){try{return"number"==typeof e?String(e):JSON.stringify(e)}catch(e){return t}}read(e){let t;return this.isSurge||this.isLoon?t=$persistentStore.read(e):this.isQuanX&&(t=$prefs.valueForKey(e)),this.toObj(t)}write(e,t){return e=this.toStr(e),this.isSurge||this.isLoon?$persistentStore.write(e,t):this.isQuanX?$prefs.setValueForKey(e,t):void 0}get(e,t){(e="string"==typeof e?{url:e}:e).headers&&(delete e.headers["Content-Type"],delete e.headers["Content-Length"]),this.isSurge||this.isLoon?(this.isSurge&&this.isNeedRewrite&&(e.headers=e.headers||{},Object.assign(e.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(e,(e,s,i)=>{!e&&s&&(s.body=i,s.statusCode=s.status),t(e,s,i)})):this.isQuanX&&(this.isNeedRewrite&&(e.opts=e.opts||{},Object.assign(e.opts,{hints:!1})),$task.fetch(e).then(e=>{const{statusCode:s,statusCode:i,headers:r,body:n}=e;t(null,{status:s,statusCode:i,headers:r,body:n},n)},e=>t(e)))}post(e,t){(e="string"==typeof e?{url:e}:e).body&&e.headers&&!e.headers["Content-Type"]&&(e.headers["Content-Type"]="application/x-www-form-urlencoded"),e.headers&&delete e.headers["Content-Length"],this.isSurge||this.isLoon?(this.isSurge&&this.isNeedRewrite&&(e.headers=e.headers||{},Object.assign(e.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(e,(e,s,i)=>{!e&&s&&(s.body=i,s.statusCode=s.status),t(e,s,i)})):this.isQuanX&&(e.method="POST",this.isNeedRewrite&&(e.opts=e.opts||{},Object.assign(e.opts,{hints:!1})),$task.fetch(e).then(e=>{const{statusCode:s,statusCode:i,headers:r,body:n}=e;t(null,{status:s,statusCode:i,headers:r,body:n},n)},e=>t(e)))}time(e,t=null,s=!1){if(!e)return t||(new Date).getTime();const i=t?new Date(t):new Date;let r=s?{"M+":i.getUTCMonth()+1,"d+":i.getUTCDate(),"H+":i.getUTCHours(),"m+":i.getUTCMinutes(),"s+":i.getUTCSeconds(),"q+":Math.floor((i.getUTCMonth()+3)/3),S:i.getUTCMilliseconds()}:{"M+":i.getMonth()+1,"d+":i.getDate(),"H+":i.getHours(),"m+":i.getMinutes(),"s+":i.getSeconds(),"q+":Math.floor((i.getMonth()+3)/3),S:i.getMilliseconds()};/(y+)/.test(e)&&(e=e.replace(RegExp.$1,(i[s?"getUTCFullYear":"getFullYear"]()+"").substr(4-RegExp.$1.length)));for(let t in r)new RegExp("("+t+")").test(e)&&(e=e.replace(RegExp.$1,1==RegExp.$1.length?r[t]:("00"+r[t]).substr((""+r[t]).length)));return e}msg(t=e,s="",i="",r){const n=e=>{if(!e)return e;if("string"==typeof e){if(this.isLoon)return e;if(this.isQuanX)return{"open-url":e};if(this.isSurge)return{url:e}}else{if("object"!=typeof e)return;if(this.isLoon){return{openUrl:e.openUrl||e.url||e["open-url"],mediaUrl:e.mediaUrl||e["media-url"]}}if(this.isQuanX){return{"open-url":e["open-url"]||e.url||e.openUrl,"media-url":e["media-url"]||e.mediaUrl}}if(this.isSurge){return{url:e.url||e.openUrl||e["open-url"]}}}};if(this.isMute||(this.isSurge||this.isLoon?$notification.post(t,s,i,n(r)):this.isQuanX&&$notify(t,s,i,n(r))),!this.isMuteLog){let e=["","==============\u{1f4e3}\u7cfb\u7edf\u901a\u77e5\u{1f4e3}=============="];e.push(t),s&&e.push(s),i&&e.push(i),this.log(...e)}}log(...e){e.length>0&&console.log(e.join(this.logSeparator))}logErr(e){this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,e)}wait(e){return new Promise(t=>setTimeout(t,e))}done(e={}){$done(e)}}(e,t)}
