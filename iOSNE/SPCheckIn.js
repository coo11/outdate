// Recommend Cron Setting: 0 */4 * * *
const $ = init("SouthPlus 签到");
const domain = "bbs.imoutolove.me"; // spring-plus.net south-plus.net etc
const retryTimes = 3;
let headers = [
  {
    Cookie:
      "eb9e6_winduser=",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36"
  }
];

!(() => {
  // $.write("", "SPCILastTime")
  const lastTime = $.read("SPCILastTime");
  $.log(lastTime);
  if (!$.read("SPCILastTime")) return true;
  const currentTime = $.time();
  let val = Math.round((currentTime - lastTime) / 3600000);
  $.log(`Interval: about ${val}h passed.`);
  return val > 20 || (val !== 0 && !val % 20);
})() && $.done();

const taskItems = [
  {
    desc: "每日 SP+2 的日常",
    code: 15,
    src: "https://bbs.imoutolove.me/hack/tasks/image/Nichijou.png",
    sp: 2
  },
  {
    desc: "无所事事的周常",
    code: 14,
    src: "https://bbs.imoutolove.me/hack/tasks/image/weekly.png",
    sp: 7
  }
  // { desc: "圣诞快乐~", code: 21 },
];

class SPCI {
  constructor(header) {
    this.header = header;
    this.restRetryTimes = retryTimes;
  }
  req(taskCode = null, isApply = true) {
    const url = (() => {
      if (taskCode) {
        return `https://${domain}/plugin.php?H_name=tasks&action=ajax&verify=11451419&nowtime=${$.time()}&cid=${taskCode}&actions=job${
          isApply ? "" : "2"
        }`;
      }
      return `https://${domain}/u.php?action=show`;
    })();
    return new Promise(resolve => {
      $.post(
        {
          url,
          headers: this.header
        },
        (err, resp, data) => {
          // $.log("CheckIn:", data);
          if (!err && resp) resolve(data);
          else if (this.restRetryTimes) {
            this.restRetryTimes--;
            $.log(
              `⚠️ REQUEST FAILED. UID: ${this.id} \nRETRY: ${
                retryTimes - this.restRetryTimes
              }`
            );
            resolve(this.req(taskCode, isApply));
          } else {
            $.log($.toStr(err));
            resolve(false);
          }
        }
      );
    });
  }
  async dash() {
    for (let i = 0; i < taskItems.length; i++) {
      const task = taskItems[i];
      const applyTask = await this.req(task.code);
      if (!applyTask) {
        /* failed to apply: 1 failed to execute: 2 not the time: 3 */
        $.logErr(`Failed to add mission '${task.desc}'.`);
        task.errCode = 1;
        continue;
      }
      if (applyTask.indexOf("success") > -1) {
        $.log(`Mission '${task.desc}' added.`);
        const execute = await this.req(task.code, false);
        if (!execute) {
          $.logErr(`Failed to execute mission '${task.desc}'.`);
          task.errCode = 2;
          continue;
        } else if (execute.indexOf("success") == -1) {
          $.logErr(`Mission '${task.desc}' hasn't applied.`);
          task.errCode = 3;
          continue;
        } else $.log(`Mission '${task.desc}' Success.`);
      } else {
        $.logErr(`Not the time to apply mission '${task.desc}'.`);
        task.errCode = 3;
      }
    }
    const userInfo = this.parseUserInfo(await this.req());
    const finished = taskItems.filter(i => !i.errCode);
    const notTheTime = taskItems.filter(i => i.errCode === 3);
    let sub = "论坛任务";
    let desc = "签到详情：";
    let isFinished = false;
    if (finished.length || notTheTime.length) {
      sub += "执行完毕 🎠";
      isFinished = true;
    } else {
      sub += "执行失败 🎭";
      desc = "本次签到任务执行失败，请检查配置信息或网络连接 😥";
    }
    if (userInfo) {
      sub = `用户 ${userInfo.nickName || userInfo.userName} 的` + sub;
      desc = `您总计拥有 SP 币 ${userInfo.sp} 🎉 ` + desc;
    }
    desc +=
      "\n" +
      (
        finished.map(i => `任务「${i.desc}」执行完毕 - SP+${i.sp}`).join("\n") +
        "\n" +
        notTheTime.map(i => `任务「${i.desc}」冷却时间未结束`).join("\n")
      ).trim();
    $.msg("SouthPlus 🔮", sub, desc.trim(), {
      openUrl: `https://${domain}/thread.php?fid=9`,
      mediaUrl: finished.length
        ? finished[finished.length - 1].src
        : `https://${domain}/images/face/a3.gif`
    });
    return isFinished;
  }
  parseUserInfo(html) {
    if (
      /href="u\.php".*?>(.*?)<\/a>.*?昵称<.*?th>(.*?)<.*?在线时间<.*?th>(.*?)<.*?SP币<.*?th>(.*?)</.test(
        html
      )
    ) {
      return {
        userName: RegExp.$1,
        nickName: RegExp.$2,
        onlineTime: RegExp.$3,
        sp: RegExp.$4.trim()
      };
    }
    return;
  }
}

(async () => {
  let allSuccess = true;
  for (let header of headers) {
    const mission = new SPCI(header);
    !(await mission.dash()) && (allSuccess = false);
  }
  allSuccess && $.write($.time(), "SPCILastTime");
  $.done();
})();

/* Chavyleung's Env.js reimplement version */
/* prettier-ignore */
function init(e,t){return new class{constructor(e,t){this.name=e,this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",Object.assign(this,t)}get isQuanX(){return"undefined"!=typeof $task}get isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}get isLoon(){return"undefined"!=typeof $loon}toObj(e,t=null){try{return JSON.parse(e)}catch(e){return t}}toStr(e,t=null){try{return"number"==typeof e?String(e):JSON.stringify(e)}catch(e){return t}}read(e){let t;return this.isSurge||this.isLoon?t=$persistentStore.read(e):this.isQuanX&&(t=$prefs.valueForKey(e)),this.toObj(t)}write(e,t){return e=this.toStr(e),this.isSurge||this.isLoon?$persistentStore.write(e,t):this.isQuanX?$prefs.setValueForKey(e,t):void 0}get(e,t){(e="string"==typeof e?{url:e}:e).headers&&(delete e.headers["Content-Type"],delete e.headers["Content-Length"]),this.isSurge||this.isLoon?(this.isSurge&&this.isNeedRewrite&&(e.headers=e.headers||{},Object.assign(e.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(e,(e,s,i)=>{!e&&s&&(s.body=i,s.statusCode=s.status),t(e,s,i)})):this.isQuanX&&(this.isNeedRewrite&&(e.opts=e.opts||{},Object.assign(e.opts,{hints:!1})),$task.fetch(e).then(e=>{const{statusCode:s,statusCode:i,headers:r,body:n}=e;t(null,{status:s,statusCode:i,headers:r,body:n},n)},e=>t(e)))}post(e,t){(e="string"==typeof e?{url:e}:e).body&&e.headers&&!e.headers["Content-Type"]&&(e.headers["Content-Type"]="application/x-www-form-urlencoded"),e.headers&&delete e.headers["Content-Length"],this.isSurge||this.isLoon?(this.isSurge&&this.isNeedRewrite&&(e.headers=e.headers||{},Object.assign(e.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(e,(e,s,i)=>{!e&&s&&(s.body=i,s.statusCode=s.status),t(e,s,i)})):this.isQuanX&&(e.method="POST",this.isNeedRewrite&&(e.opts=e.opts||{},Object.assign(e.opts,{hints:!1})),$task.fetch(e).then(e=>{const{statusCode:s,statusCode:i,headers:r,body:n}=e;t(null,{status:s,statusCode:i,headers:r,body:n},n)},e=>t(e)))}time(e,t=null,s=!1){if(!e)return t||(new Date).getTime();const i=t?new Date(t):new Date;let r=s?{"M+":i.getUTCMonth()+1,"d+":i.getUTCDate(),"H+":i.getUTCHours(),"m+":i.getUTCMinutes(),"s+":i.getUTCSeconds(),"q+":Math.floor((i.getUTCMonth()+3)/3),S:i.getUTCMilliseconds()}:{"M+":i.getMonth()+1,"d+":i.getDate(),"H+":i.getHours(),"m+":i.getMinutes(),"s+":i.getSeconds(),"q+":Math.floor((i.getMonth()+3)/3),S:i.getMilliseconds()};/(y+)/.test(e)&&(e=e.replace(RegExp.$1,(i[s?"getUTCFullYear":"getFullYear"]()+"").substr(4-RegExp.$1.length)));for(let t in r)new RegExp("("+t+")").test(e)&&(e=e.replace(RegExp.$1,1==RegExp.$1.length?r[t]:("00"+r[t]).substr((""+r[t]).length)));return e}msg(t=e,s="",i="",r){const n=e=>{if(!e)return e;if("string"==typeof e){if(this.isLoon)return e;if(this.isQuanX)return{"open-url":e};if(this.isSurge)return{url:e}}else{if("object"!=typeof e)return;if(this.isLoon){return{openUrl:e.openUrl||e.url||e["open-url"],mediaUrl:e.mediaUrl||e["media-url"]}}if(this.isQuanX){return{"open-url":e["open-url"]||e.url||e.openUrl,"media-url":e["media-url"]||e.mediaUrl}}if(this.isSurge){return{url:e.url||e.openUrl||e["open-url"]}}}};if(this.isMute||(this.isSurge||this.isLoon?$notification.post(t,s,i,n(r)):this.isQuanX&&$notify(t,s,i,n(r))),!this.isMuteLog){let e=["","==============\u{1f4e3}\u7cfb\u7edf\u901a\u77e5\u{1f4e3}=============="];e.push(t),s&&e.push(s),i&&e.push(i),this.log(...e)}}log(...e){e.length>0&&console.log(e.join(this.logSeparator))}logErr(e){this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,e)}wait(e){return new Promise(t=>setTimeout(t,e))}done(e={}){$done(e)}}(e,t)}
