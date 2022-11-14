const $ = init("SPNewLocalization");
const retryTimes = 3;

class SPNL {
  constructor() {
    this.restRetryTimes = retryTimes;
    this.maxNotificationNum = 10;
    this.keyName = `${$.name}LastInfo`;
    this.domain = "bbs.imoutolove.me";
    this.keyword = [
      "无修正",
      "無修正",
      "單行本",
      "单行本",
      "よこしま日記",
      "うまくち醤油",
      "みちきんぐ",
      "ホムンクルス",
      "いつつせ",
      "五月猫"
    ];
    this.searchLogic = "OR"; // "AND"
    this.today = $.time("yyyy-MM-dd", $.time());
    this.yesterday = $.time("yyyy-MM-dd", $.time() - 864e5);
    this.dayBeforeYesterday = $.time("yyyy-MM-dd", $.time() - 864e5 * 2);
    this.icon =
      "https://img14.360buyimg.com/ddimg/jfs/t1/153393/2/15874/43836/60097d16Ef23ba500/b78c5941b85eac8b.png";
    //"https://p.sda1.dev/1/b8211780f3c35b04484fe578e8e2d95c/SPAvtar.png"
  }
  get queryUrl() {
    return encodeURI(
      `https://${this.domain}/search.php?step=2&method=${
        this.searchLogic
      }&sch_area=0&f_fid=36&sch_time=all&orderway=postdate&asc=DESC&keyword=${this.keyword.join(
        "+"
      )}`
    );
  }
  parse(html) {
    let re =
        /read\.php\?tid-(\d+)-keyword.*?>(.*?)<\/a>.*?u\.php\?action-show-uid-(\d+).*?>(.*?)<\/a>.*?>([-0-9]+)<\/td>/g,
      matched = [],
      result,
      lastTid = $.read(this.keyName) || "0";
    // lastTid = 0;
    while ((result = re.exec(html))) {
      // $.log(result);
      let [, tid, title, uid, username, date] = result;
      if (
        tid > lastTid &&
        (date === this.today ||
          date === this.yesterday ||
          date === this.dayBeforeYesterday)
      ) {
        title = title
          .replace(/<font color="(red|#FF0000)">/g, "")
          .replace(/<\/font>/g, "")
          .replace(/<b>(.*?)<\/b>/g, "$1")
          .replace(/<u>(.*?)<\/u>/g, "$1")
          .replace(/&amp;/g, "&");
        matched.push({ tid, title, uid, username, date });
      }
    }
    $.log($.toStr(matched));
    if (matched.length) $.write(matched[0].tid, this.keyName);
    return matched;
  }
  request() {
    return new Promise((resolve, reject) => {
      $.get(
        {
          url: this.queryUrl,
          headers: {
            Cookie:
              "eb9e6_winduser=BBBBBBBBBBBBBBBBBBBBBBB%3D;",
            "User-Agent":
              "Mozilla/5.0 (iPhone; CPU iPhone OS 13_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Mobile/15E148 Safari/604.1"
          }
        },
        (err, resp, data) => {
          $.log(data);
          if (!err && resp) {
            if (
              data.indexOf("你所属的用户组不能使用搜索功能") > -1 ||
              data.indexOf("需要重新登录") > -1
            ) {
              reject("请检查 Cookie 是否有效");
            } else resolve(this.parse(data));
          }
          reject("请求失败");
        }
      );
    });
  }
  async dash() {
    let newPublished;
    try {
      newPublished = await this.request();
      if (!newPublished.length) {
        throw new Error("暂无更新");
      }
    } catch (e) {
      $.log(e.toString());
      if (e.toString() != "Error: 暂无更新") {
        //$.log($.toStr(e))
        if (!this.restRetryTimes)
          $.msg("魂+论坛 🎏", "出了点儿问题 😱", e, {
            mediaUrl: this.icon
          });
        else {
          this.restRetryTimes--;
          return this.dash();
        }
      }
    }
    if (Array.isArray(newPublished)) {
      const n = newPublished.length;
      for (let i = 0; i < n; i++) {
        const { title, username, uid, tid } = newPublished[i];
        $.msg(
          "魂+论坛 🐣",
          `发现新汉化本～ 快来康康(${i + 1}/${n}) 🦄`,
          `${title}\n发布者: ${username}(UID: ${uid})`,
          {
            openUrl: `https://${this.domain}/read.php?tid=${tid}`,
            mediaUrl: this.icon
          }
        );
      }
    }
  }
}

(async () => {
  await new SPNL().dash();
  $.done();
})();

/* Chavyleung's Env.js reimplement version */
/* prettier-ignore */
function init(e,t){return new class{constructor(e,t){this.name=e,this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",Object.assign(this,t)}get isQuanX(){return"undefined"!=typeof $task}get isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}get isLoon(){return"undefined"!=typeof $loon}toObj(e,t=null){try{return JSON.parse(e)}catch(e){return t}}toStr(e,t=null){try{return JSON.stringify(e)}catch(e){return t}}read(e,t=!1){let s;return this.isSurge||this.isLoon?s=$persistentStore.read(e):this.isQuanX&&(s=$prefs.valueForKey(e)),t?this.toObj(s):s}write(e,t,s=!1){return s&&(e=this.toStr(e)),this.isSurge||this.isLoon?$persistentStore.write(e,t):this.isQuanX?$prefs.setValueForKey(e,t):void 0}get(e,t){(e="string"==typeof e?{url:e}:e).headers&&(delete e.headers["Content-Type"],delete e.headers["Content-Length"]),this.isSurge||this.isLoon?(this.isSurge&&this.isNeedRewrite&&(e.headers=e.headers||{},Object.assign(e.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(e,(e,s,i)=>{!e&&s&&(s.body=i,s.statusCode=s.status),t(e,s,i)})):this.isQuanX&&(this.isNeedRewrite&&(e.opts=e.opts||{},Object.assign(e.opts,{hints:!1})),$task.fetch(e).then(e=>{const{statusCode:s,statusCode:i,headers:r,body:n}=e;t(null,{status:s,statusCode:i,headers:r,body:n},n)},e=>t(e)))}post(e,t){(e="string"==typeof e?{url:e}:e).body&&e.headers&&!e.headers["Content-Type"]&&(e.headers["Content-Type"]="application/x-www-form-urlencoded"),e.headers&&delete e.headers["Content-Length"],this.isSurge||this.isLoon?(this.isSurge&&this.isNeedRewrite&&(e.headers=e.headers||{},Object.assign(e.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(e,(e,s,i)=>{!e&&s&&(s.body=i,s.statusCode=s.status),t(e,s,i)})):this.isQuanX&&(e.method="POST",this.isNeedRewrite&&(e.opts=e.opts||{},Object.assign(e.opts,{hints:!1})),$task.fetch(e).then(e=>{const{statusCode:s,statusCode:i,headers:r,body:n}=e;t(null,{status:s,statusCode:i,headers:r,body:n},n)},e=>t(e)))}time(e,t=null){if(!e)return t||(new Date).getTime();const s=t?new Date(t):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(e)&&(e=e.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let t in i)new RegExp("("+t+")").test(e)&&(e=e.replace(RegExp.$1,1==RegExp.$1.length?i[t]:("00"+i[t]).substr((""+i[t]).length)));return e}msg(t=e,s="",i="",r){const n=e=>{if(!e)return e;if("string"==typeof e){if(this.isLoon)return e;if(this.isQuanX)return{"open-url":e};if(this.isSurge)return{url:e}}else{if("object"!=typeof e)return;if(this.isLoon){return{openUrl:e.openUrl||e.url||e["open-url"],mediaUrl:e.mediaUrl||e["media-url"]}}if(this.isQuanX){return{"open-url":e["open-url"]||e.url||e.openUrl,"media-url":e["media-url"]||e.mediaUrl}}if(this.isSurge){return{url:e.url||e.openUrl||e["open-url"]}}}};if(this.isMute||(this.isSurge||this.isLoon?$notification.post(t,s,i,n(r)):this.isQuanX&&$notify(t,s,i,n(r))),!this.isMuteLog){let e=["","==============\u{1f4e3}\u7cfb\u7edf\u901a\u77e5\u{1f4e3}=============="];e.push(t),s&&e.push(s),i&&e.push(i),this.log(...e)}}log(...e){e.length>0&&console.log(e.join(this.logSeparator))}logErr(e){this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,e)}wait(e){return new Promise(t=>setTimeout(t,e))}done(e={}){$done(e)}}(e,t)}
