const $ = init("Gmgard 签到");
const domain = "gmgard.com"; // "gmgard.moe" "hggard.com"
const retryTimes = 3;
const cookies = [
  ".AspNetCore.Identity.Application=AAAAAAAAAAAAAAAAAA;"
];

class GMCI {
  constructor(cookie) {
    this.cookie = cookie;
    this.restRetryTimes = retryTimes;
  }
  req(path) {
    return new Promise(resolve => {
      $.post(
        {
          url: `https://${domain}/api/${path}`,
          headers: {
            Cookie: this.cookie,
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36"
          }
        },
        (err, resp, data) => {
          $.log(path, data);
          if (!err && resp) resolve(data);
          else if (this.restRetryTimes) {
            this.restRetryTimes--;
            $.log(
              `⚠️ REQUEST FAILED. UID: ${this.id} \nRETRY: ${
                retryTimes - this.restRetryTimes
              }`
            );
            resolve(this.req(path));
          } else {
            $.log($.toStr(err));
            resolve(false);
          }
        }
      );
    });
  }
  async dash() {
    let checkedInfo = $.toObj(
      ((await this.req("PunchIn/Do")) || "null").toLowerCase()
    );
    $.log(checkedInfo);
    let userInfo = $.toObj(await this.req("Account/GetUser"));
    let title = "GMgard 🎩",
      avatar = `https://${domain}/Images/nazoshinshi.jpg`;
    let sub, descPrefix, descSuffix, lastSignDate;
    if (
      (!checkedInfo && !userInfo) ||
      (typeof checkedInfo === "string" && checkedInfo.indexOf("401") > -1) ||
      userInfo.status === 401
    ) {
      return $.msg(
        title,
        "签到与获取用户信息失败 🙅‍",
        `请检查${
          cookies.length > 1
            ? "第 " + String(cookies.indexOf(this.cookie) + 1) + " 条"
            : "你的"
        } Cookie 信息或网络连接 💫`
      );
    }
    // if (cookies.length > 1) title += ` (UID:${userInfo.userId})`;
    if (userInfo) {
      avatar = userInfo.avatar;
      descPrefix = `尊贵的 ${
        userInfo.nickName || userInfo.userName
      } 大人, 您已连续签到 ${userInfo.consecutiveSign} 天。\n`;
      descSuffix = `您的绅士度总计为 ${userInfo.experience}, 棒棒糖合计 ${userInfo.points} 根。\n当前等级为 Lv.${userInfo.level}。`;
      lastSignDate = userInfo.lastSignDate.split("T")[0];
    } else {
      descPrefix = `更多绅士大人的统计信息获取失败。`;
    }
    if (checkedInfo) {
      sub = checkedInfo.success
        ? `今日签到成功 ✌️ 绅士度+${checkedInfo.expbonus}🎩 棒棒糖+${checkedInfo.expbonus}🍭`
        : `今日您已经签到 😀`;
      if (!userInfo)
        descSuffix = `\n您大概已经连续签到了 ${checkedInfo.consecutivedays} 天, 总计拥有棒棒糖 ${checkedInfo.points} 根。`;
    } else {
      if (lastSignDate === $.time("yyyy-MM-dd")) {
        sub = `今日您已经签到 😀`;
      } else {
        sub = `今日签到失败 😫 您于 ${lastSignDate} 最后一次签到成功`;
      }
    }
    return $.msg(title, sub, descPrefix + descSuffix, {
      openUrl: `https://${domain}`,
      mediaUrl: avatar
    });
  }
}

(async () => {
  for (let cookie of cookies) {
    const mission = new GMCI(cookie);
    await mission.dash();
  }
  $.done();
})();

/* Chavyleung's Env.js reimplement version */
/* prettier-ignore */
function init(e,t){return new class{constructor(e,t){this.name=e,this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",Object.assign(this,t)}get isQuanX(){return"undefined"!=typeof $task}get isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}get isLoon(){return"undefined"!=typeof $loon}toObj(e,t=null){try{return JSON.parse(e)}catch(e){return t}}toStr(e,t=null){try{return"number"==typeof e?String(e):JSON.stringify(e)}catch(e){return t}}read(e){let t;return this.isSurge||this.isLoon?t=$persistentStore.read(e):this.isQuanX&&(t=$prefs.valueForKey(e)),this.toObj(t)}write(e,t){return e=this.toStr(e),this.isSurge||this.isLoon?$persistentStore.write(e,t):this.isQuanX?$prefs.setValueForKey(e,t):void 0}get(e,t){(e="string"==typeof e?{url:e}:e).headers&&(delete e.headers["Content-Type"],delete e.headers["Content-Length"]),this.isSurge||this.isLoon?(this.isSurge&&this.isNeedRewrite&&(e.headers=e.headers||{},Object.assign(e.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(e,(e,s,i)=>{!e&&s&&(s.body=i,s.statusCode=s.status),t(e,s,i)})):this.isQuanX&&(this.isNeedRewrite&&(e.opts=e.opts||{},Object.assign(e.opts,{hints:!1})),$task.fetch(e).then(e=>{const{statusCode:s,statusCode:i,headers:r,body:n}=e;t(null,{status:s,statusCode:i,headers:r,body:n},n)},e=>t(e)))}post(e,t){(e="string"==typeof e?{url:e}:e).body&&e.headers&&!e.headers["Content-Type"]&&(e.headers["Content-Type"]="application/x-www-form-urlencoded"),e.headers&&delete e.headers["Content-Length"],this.isSurge||this.isLoon?(this.isSurge&&this.isNeedRewrite&&(e.headers=e.headers||{},Object.assign(e.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(e,(e,s,i)=>{!e&&s&&(s.body=i,s.statusCode=s.status),t(e,s,i)})):this.isQuanX&&(e.method="POST",this.isNeedRewrite&&(e.opts=e.opts||{},Object.assign(e.opts,{hints:!1})),$task.fetch(e).then(e=>{const{statusCode:s,statusCode:i,headers:r,body:n}=e;t(null,{status:s,statusCode:i,headers:r,body:n},n)},e=>t(e)))}time(e,t=null,s=!1){if(!e)return t||(new Date).getTime();const i=t?new Date(t):new Date;let r=s?{"M+":i.getUTCMonth()+1,"d+":i.getUTCDate(),"H+":i.getUTCHours(),"m+":i.getUTCMinutes(),"s+":i.getUTCSeconds(),"q+":Math.floor((i.getUTCMonth()+3)/3),S:i.getUTCMilliseconds()}:{"M+":i.getMonth()+1,"d+":i.getDate(),"H+":i.getHours(),"m+":i.getMinutes(),"s+":i.getSeconds(),"q+":Math.floor((i.getMonth()+3)/3),S:i.getMilliseconds()};/(y+)/.test(e)&&(e=e.replace(RegExp.$1,(i[s?"getUTCFullYear":"getFullYear"]()+"").substr(4-RegExp.$1.length)));for(let t in r)new RegExp("("+t+")").test(e)&&(e=e.replace(RegExp.$1,1==RegExp.$1.length?r[t]:("00"+r[t]).substr((""+r[t]).length)));return e}msg(t=e,s="",i="",r){const n=e=>{if(!e)return e;if("string"==typeof e){if(this.isLoon)return e;if(this.isQuanX)return{"open-url":e};if(this.isSurge)return{url:e}}else{if("object"!=typeof e)return;if(this.isLoon){return{openUrl:e.openUrl||e.url||e["open-url"],mediaUrl:e.mediaUrl||e["media-url"]}}if(this.isQuanX){return{"open-url":e["open-url"]||e.url||e.openUrl,"media-url":e["media-url"]||e.mediaUrl}}if(this.isSurge){return{url:e.url||e.openUrl||e["open-url"]}}}};if(this.isMute||(this.isSurge||this.isLoon?$notification.post(t,s,i,n(r)):this.isQuanX&&$notify(t,s,i,n(r))),!this.isMuteLog){let e=["","==============\u{1f4e3}\u7cfb\u7edf\u901a\u77e5\u{1f4e3}=============="];e.push(t),s&&e.push(s),i&&e.push(i),this.log(...e)}}log(...e){e.length>0&&console.log(e.join(this.logSeparator))}logErr(e){this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,e)}wait(e){return new Promise(t=>setTimeout(t,e))}done(e={}){$done(e)}}(e,t)}
