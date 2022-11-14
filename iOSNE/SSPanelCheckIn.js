"user strict";
const $ = init("SSPanelCheckIn");
const muteIfCheckedIn = false;
const retryTimes = 3;
const accounts = [
  [
    "CCCCCCCCC",
    "https://www.DDDDDDDDDDD.biz/auth/login",
    "aaaaaaaaaaa@outlook.com",
    "bbbbbbbbbbb",
    "https://img12.360buyimg.com/ddimg/jfs/t1/63539/3/16705/41178/61404444Ebebfde6c/eeeeeeeeeeeeeee.png"
  ]
];
const pathSet = [
  {
    login: "auth/login",
    logout: "user/logout",
    check: "user/checkin",
    home: "user"
  },
  {
    login: "user/_login.php",
    logout: "user/logout.php",
    check: "user/_checkin.php",
    home: "user/index.php"
  }
];

class SSPCI {
  constructor(info) {
    this.restRetryTimes = retryTimes;
    this.isLogined = false;
    this.checkinMsg = null;
    this.flowMsg = null;
    this.title = info[0];
    this.prefix = info[1].replace(/https?:\/\/([^/]*).+/, "https://$1");
    this.paths = pathSet.filter(i => info[1].indexOf(i.login) > -1)[0];
    this.loginBody = { email: info[2], passwd: info[3], "rumber-me": "week" };
    this.image = info[4] || null;
    /** @member {Object} - The cached checked Info. value format: yyyy-MM-dd|GiftFlow */
    this.key = `${$.name}|${this.title}|${info[2]}`;
  }
  login() {
    return new Promise((resolve, reject) => {
      $.get(`${this.prefix}/${this.paths.logout}`, () => {
        $.post(
          {
            // If not add 'application/json' and convert the body to string, error will occur in QuanX.
            url: `${this.prefix}/${this.paths.login}`,
            headers: { "Content-Type": "application/json" },
            body: $.toStr(this.loginBody)
          },
          (err, resp, data) => {
            if (!err && resp) {
              const { msg } = $.toObj(data);
              $.log(msg);
              if (/错误|incorrect/.test(msg)) {
                reject(`登录失败，${msg}`);
              } else resolve(true);
            } else reject("登陆失败，请求错误");
          }
        );
      });
    });
  }
  checkIn() {
    return new Promise((resolve, reject) => {
      $.post(`${this.prefix}/${this.paths.check}`, (err, resp, data) => {
        if (!err && resp) {
          if (/"msg":/.test(data)) {
            const { msg } = $.toObj(data);
            $.log(msg);
            const result = msg.match(/[\d.]+?\s?(?:K|G|M|T)B?/i);
            result ? resolve(result[0]) : reject(true);
          }
        }
        reject("请求失败");
      });
    });
  }
  parseData() {
    return new Promise((resolve, reject) => {
      $.get(`${this.prefix}/${this.paths.home}`, (err, resp, data) => {
        if (!err && resp) {
          let result = [];
          let usedData = data.match(
            />?\s*已用.*?([\d.]+?%).*?([\d.]+?(?:K|G|M|T)B)/i
          );
          if (usedData) {
            let todayData = data.match(
              />?\s*(?:今日|今天).*?([\d.]+?%).*?([\d.]+?(?:K|G|M|T)B)/i
            );
            result.push(`📊 今日已用 ${todayData[2]} 占 ${todayData[1]}`);
            let restData = data.match(
              />?\s*(?:剩余|可用).*?([\d.]+?%).*?([\d.]+?(?:K|G|M|T)B)/i
            );
            result.push(`📉 剩余流量 ${restData[2]} 占 ${restData[1]}`);
            result.push(`📈 已用总计 ${usedData[2]} 占 ${usedData[1]}`);
          } else reject("详细信息解析错误");
          $.log(result);
          resolve(result.join("\n"));
        }
        reject("详细信息获取失败");
      });
    });
  }
  async dash() {
    if (!this.isLogined) {
      try {
        this.isLogined = await this.login();
      } catch (e) {
        if (this.restRetryTimes) {
          this.restRetryTimes--;
          return await this.dash();
        } else
          return $.$msg(
            `${this.title} - 签到失败`,
            `${e}`,
            `(已重试 ${retryTimes} 次)`
          );
      }
    }
    if (!this.checkinMsg) {
      try {
        const flow = await this.checkIn();
        this.checkinMsg = `🎲 签到完毕，获得 ${flow} 流量~`;
        $.write(`${$.time("yyyy-MM-dd")}|${flow}`, this.key);
      } catch (e) {
        if (e && typeof e === "boolean") {
          let checkedInfo = $.read(this.key),
            flow;
          if (checkedInfo) {
            checkedInfo = checkedInfo.split("|");
            checkedInfo[0] === $.time("yyyy-MM-dd") && (flow = checkedInfo[1]);
          }
          if (flow) {
            this.checkinMsg = `🤔 今天已经签过了，获得 ${flow} 流量`;
            if (muteIfCheckedIn) {
              return $.log(
                "Notification Muting Enabled.",
                this.title,
                this.checkinMsg
              );
            }
          } else
            this.checkinMsg = "😅 今天已经签过了，然而送了多少流量咱也不知道~";
        } else if (this.restRetryTimes) {
          this.restRetryTimes--;
          return await this.dash();
        } else this.checkinMsg = `😡 签到状态：${e}`;
      }
    }
    if (!this.flowMsg) {
      try {
        this.flowMsg = await this.parseData();
      } catch (e) {
        if (this.restRetryTimes) {
          this.restRetryTimes--;
          return await this.dash();
        } else this.flowMsg = e;
      }
    }
    const n = retryTimes - this.restRetryTimes,
      suffix = n ? ` (已重试 ${n} 次)` : "";
    return $.msg(
      `${this.title} - 签到/查询${suffix}`,
      this.checkinMsg,
      this.flowMsg,
      {
        mediaUrl: this.image
      }
    );
  }
}

(async () => {
  for (let account of accounts) {
    const mission = new SSPCI(account);
    await mission.dash();
  }
  $.done();
})();

/* Chavyleung's Env.js reimplement version */
/* prettier-ignore */
function init(e,t){return new class{constructor(e,t){this.name=e,this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",Object.assign(this,t)}get isQuanX(){return"undefined"!=typeof $task}get isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}get isLoon(){return"undefined"!=typeof $loon}toObj(e,t=null){try{return JSON.parse(e)}catch(e){return t}}toStr(e,t=null){try{return"number"==typeof e?String(e):JSON.stringify(e)}catch(e){return t}}read(e){let t;return this.isSurge||this.isLoon?t=$persistentStore.read(e):this.isQuanX&&(t=$prefs.valueForKey(e)),this.toObj(t)}write(e,t){return e=this.toStr(e),this.isSurge||this.isLoon?$persistentStore.write(e,t):this.isQuanX?$prefs.setValueForKey(e,t):void 0}get(e,t){(e="string"==typeof e?{url:e}:e).headers&&(delete e.headers["Content-Type"],delete e.headers["Content-Length"]),this.isSurge||this.isLoon?(this.isSurge&&this.isNeedRewrite&&(e.headers=e.headers||{},Object.assign(e.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(e,(e,s,i)=>{!e&&s&&(s.body=i,s.statusCode=s.status),t(e,s,i)})):this.isQuanX&&(this.isNeedRewrite&&(e.opts=e.opts||{},Object.assign(e.opts,{hints:!1})),$task.fetch(e).then(e=>{const{statusCode:s,statusCode:i,headers:r,body:n}=e;t(null,{status:s,statusCode:i,headers:r,body:n},n)},e=>t(e)))}post(e,t){(e="string"==typeof e?{url:e}:e).body&&e.headers&&!e.headers["Content-Type"]&&(e.headers["Content-Type"]="application/x-www-form-urlencoded"),e.headers&&delete e.headers["Content-Length"],this.isSurge||this.isLoon?(this.isSurge&&this.isNeedRewrite&&(e.headers=e.headers||{},Object.assign(e.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(e,(e,s,i)=>{!e&&s&&(s.body=i,s.statusCode=s.status),t(e,s,i)})):this.isQuanX&&(e.method="POST",this.isNeedRewrite&&(e.opts=e.opts||{},Object.assign(e.opts,{hints:!1})),$task.fetch(e).then(e=>{const{statusCode:s,statusCode:i,headers:r,body:n}=e;t(null,{status:s,statusCode:i,headers:r,body:n},n)},e=>t(e)))}time(e,t=null,s=!1){if(!e)return t||(new Date).getTime();const i=t?new Date(t):new Date;let r=s?{"M+":i.getUTCMonth()+1,"d+":i.getUTCDate(),"H+":i.getUTCHours(),"m+":i.getUTCMinutes(),"s+":i.getUTCSeconds(),"q+":Math.floor((i.getUTCMonth()+3)/3),S:i.getUTCMilliseconds()}:{"M+":i.getMonth()+1,"d+":i.getDate(),"H+":i.getHours(),"m+":i.getMinutes(),"s+":i.getSeconds(),"q+":Math.floor((i.getMonth()+3)/3),S:i.getMilliseconds()};/(y+)/.test(e)&&(e=e.replace(RegExp.$1,(i[s?"getUTCFullYear":"getFullYear"]()+"").substr(4-RegExp.$1.length)));for(let t in r)new RegExp("("+t+")").test(e)&&(e=e.replace(RegExp.$1,1==RegExp.$1.length?r[t]:("00"+r[t]).substr((""+r[t]).length)));return e}msg(t=e,s="",i="",r){const n=e=>{if(!e)return e;if("string"==typeof e){if(this.isLoon)return e;if(this.isQuanX)return{"open-url":e};if(this.isSurge)return{url:e}}else{if("object"!=typeof e)return;if(this.isLoon){return{openUrl:e.openUrl||e.url||e["open-url"],mediaUrl:e.mediaUrl||e["media-url"]}}if(this.isQuanX){return{"open-url":e["open-url"]||e.url||e.openUrl,"media-url":e["media-url"]||e.mediaUrl}}if(this.isSurge){return{url:e.url||e.openUrl||e["open-url"]}}}};if(this.isMute||(this.isSurge||this.isLoon?$notification.post(t,s,i,n(r)):this.isQuanX&&$notify(t,s,i,n(r))),!this.isMuteLog){let e=["","==============\u{1f4e3}\u7cfb\u7edf\u901a\u77e5\u{1f4e3}=============="];e.push(t),s&&e.push(s),i&&e.push(i),this.log(...e)}}log(...e){e.length>0&&console.log(e.join(this.logSeparator))}logErr(e){this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,e)}wait(e){return new Promise(t=>setTimeout(t,e))}done(e={}){$done(e)}}(e,t)}
