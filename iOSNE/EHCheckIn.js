const $ = init("E-Hentai 签到");
const retryTimes = 3;
const cookies = [
  "ipb_member_id=123456; ipb_pass_hash=1234569dbf78712e29e865bc4838723",
  "ipb_member_id=234567; ipb_pass_hash=23456779ae0081e55c427f9ab8d3fd2"
];

const misc = {
  eh: "https://e-hentai.org",
  ex: "https://exhentai.org",
  type: 0,
  pages: [
    { show: "front page 🐳\n", path: "" },
    { show: "your watched 🦋\n", path: "/watched" },
    { show: "popular now 🦄\n", path: "/popular" },
    { show: "your favorites 🦊\n", path: "/favorites.php" }
  ],
  types: ["EXP", "Credits", "GP", "Hath"],
  typos: ["𝐄𝐗𝐏", "𝐂𝐫𝐞𝐝𝐢𝐭𝐬", "𝐆𝐏", "𝐇𝐚𝐭𝐡"]
};

const status = {
  success: {
    sub: "It is the dawn of a new day! 😇",
    desc: "Reflecting on your journey so far, you find that you are a little wiser. 😆\n"
  },
  checked: {
    sub: "You have checked panda! 🥳",
    desc: `Tap me to see ${misc.pages[misc.type].show}`
  },
  unknown: {
    sub: "May you have checked or visited panda! 🍄",
    desc: "Or you fed him bad cookies 🍪\n"
  },
  failure: {
    sub: "Check failure 🙀",
    desc: "Watch your internet connection 👻\n"
  }
};

class EHCI {
  constructor(cookie) {
    this.cookie = cookie;
    this.restRetryTimes = retryTimes;
    this.id = (() => {
      const id = parseCookie(cookie).ipb_member_id;
      if (!id) throw new Error("Cookie parse error.");
      return id;
    })();
    this.status = "unknown";
    this.today = $.time("yyyy-MM-dd", null, true);
    this.yesterday = $.time("yyyy-MM-dd", $.time() - 1152e5, true);
    this.cacheName = `EHCheck${this.id}Today`;
    this.prevCacheName = `EHCheck${this.id}Prev`;
  }
  get info() {
    return $.read(this.cacheName) || $.read(this.prevCacheName);
  }
  set info(value) {
    if (value && Object.keys(value).length) {
      value.time = this.today;
      // $.log("51:", $.toStr(value));
      const oldInfo = $.read(this.cacheName);
      oldInfo && $.write(oldInfo, this.prevCacheName);
      $.write(value, this.cacheName);
    }
  }
  check() {
    return new Promise(resolve => {
      const cookie = `event=${String($.time() - 432e5).slice(0, -3)}; ${
        this.cookie
      }`;
      $.log(cookie);
      $.get(
        {
          url: `${misc.eh}/news.php`,
          headers: {
            Cookie: cookie,
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36"
          }
        },
        (err, resp, data) => {
          // $.log("72:", data);
          if (!err && resp) resolve(data);
          else if (this.restRetryTimes) {
            this.restRetryTimes--;
            $.log(
              `⚠️ REQUEST FAILED. UID: ${this.id} \nRETRY: ${
                retryTimes - this.restRetryTimes
              }`
            );
            resolve(this.check());
          } else {
            this.status = "failure";
            $.log($.toStr(err));
            resolve(false);
          }
        }
      );
    });
  }
  parse(string) {
    let info = {};
    if (
      /img src="(https:\/\/ehgt.org\/.*?)"[\s\S]*?<p.*?>(You gain.*?)<\/p>/.test(
        string
      )
    ) {
      info.src = RegExp.$1;
      let data = RegExp.$2
        .replace(/,/g, "")
        .split(/<\/?strong>|!|\s/)
        .filter(i => i !== "");
      //$.log("90:", data);
      for (let i of misc.types) {
        const n = data.indexOf(i) - 1;
        if (n > -1 && /^\d+$/.test(data[n])) {
          info[i] = data[n];
        }
      }
      return info;
    }
    return;
  }
  async dash() {
    if (!this.cookie) {
      $.logErr("Cookies Not Found.");
      this.status = "failure";
      return this.notify();
    }
    let info = this.info;
    if (info && info.time === this.today) {
      this.status = "checked";
      return this.notify();
    }
    const data = await this.check();
    if (data) this.info = this.parse(data);
    return this.notify();
  }
  notify() {
    let info = this.info;
    if (info && info.time === this.today && this.status !== "checked")
      this.status = "success";
    let { sub, desc } = status[this.status];
    // $.log("120:", $.toStr(info), this.status);
    if (info) {
      const joined = `Your ${this.join(info)}`;
      switch (info.time) {
        case this.today:
          desc += `${joined} today! ✨`;
          break;
        case this.yesterday:
          desc += `${joined} yesterday! 🦜`;
          break;
        default:
          desc += `${joined} in ${info.time} lastly! 🐠`;
      }
    } else desc += status.checked.desc.slice(0, -1);
    let title = "E-Hentai Galleries 🐼";
    if (cookies.length > 1) title += ` (UID:${this.id})`;
    $.msg(title, sub, desc, {
      openUrl: `${misc.ex}${misc.pages[misc.type].path}`,
      mediaUrl:
        this.status === "failure" || this.status === "unknown"
          ? "https://img10.360buyimg.com/ddimg/jfs/t1/170426/37/1153/214846/5ff4904fE5925641c/17c68721200fcd3a.png"
          : //"https://p.sda1.dev/0/b69925d582715d31b95df3b5e0ee67b7/sadpanda_560.png"
            info.src
    });
  }
  join(info) {
    let desc = [];
    for (let i = 0; i < 4; i++) {
      let reward = misc.types[i];
      if (reward in info) {
        desc.push(`${misc.typos[i]} +${info[reward]}`);
      }
    }
    let n = desc.length;
    if (desc.length > 1) {
      desc.splice(n - 2, 2, `${desc[n - 2]} & ${desc[n - 1]}`);
    }
    return desc.join(", ");
  }
}

(async () => {
  for (let cookie of cookies) {
    const mission = new EHCI(cookie);
    await mission.dash();
  }
  $.done();
})();

function parseCookie(rawStr) {
  const output = {};
  rawStr.split(/\s*;\s*/).forEach(pair => {
    pair = pair.split(/\s*=\s*/);
    output[pair[0]] = pair.splice(1).join("=");
  });
  //$.log(JSON.stringify(output, null, 4))
  return output;
}

/* Chavyleung's Env.js reimplement version */
/* prettier-ignore */
function init(e,t){return new class{constructor(e,t){this.name=e,this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",Object.assign(this,t)}get isQuanX(){return"undefined"!=typeof $task}get isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}get isLoon(){return"undefined"!=typeof $loon}toObj(e,t=null){try{return JSON.parse(e)}catch(e){return t}}toStr(e,t=null){try{return"number"==typeof e?String(e):JSON.stringify(e)}catch(e){return t}}read(e){let t;return this.isSurge||this.isLoon?t=$persistentStore.read(e):this.isQuanX&&(t=$prefs.valueForKey(e)),this.toObj(t)}write(e,t){return e=this.toStr(e),this.isSurge||this.isLoon?$persistentStore.write(e,t):this.isQuanX?$prefs.setValueForKey(e,t):void 0}get(e,t){(e="string"==typeof e?{url:e}:e).headers&&(delete e.headers["Content-Type"],delete e.headers["Content-Length"]),this.isSurge||this.isLoon?(this.isSurge&&this.isNeedRewrite&&(e.headers=e.headers||{},Object.assign(e.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(e,(e,s,i)=>{!e&&s&&(s.body=i,s.statusCode=s.status),t(e,s,i)})):this.isQuanX&&(this.isNeedRewrite&&(e.opts=e.opts||{},Object.assign(e.opts,{hints:!1})),$task.fetch(e).then(e=>{const{statusCode:s,statusCode:i,headers:r,body:n}=e;t(null,{status:s,statusCode:i,headers:r,body:n},n)},e=>t(e)))}post(e,t){(e="string"==typeof e?{url:e}:e).body&&e.headers&&!e.headers["Content-Type"]&&(e.headers["Content-Type"]="application/x-www-form-urlencoded"),e.headers&&delete e.headers["Content-Length"],this.isSurge||this.isLoon?(this.isSurge&&this.isNeedRewrite&&(e.headers=e.headers||{},Object.assign(e.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(e,(e,s,i)=>{!e&&s&&(s.body=i,s.statusCode=s.status),t(e,s,i)})):this.isQuanX&&(e.method="POST",this.isNeedRewrite&&(e.opts=e.opts||{},Object.assign(e.opts,{hints:!1})),$task.fetch(e).then(e=>{const{statusCode:s,statusCode:i,headers:r,body:n}=e;t(null,{status:s,statusCode:i,headers:r,body:n},n)},e=>t(e)))}time(e,t=null,s=!1){if(!e)return t||(new Date).getTime();const i=t?new Date(t):new Date;let r=s?{"M+":i.getUTCMonth()+1,"d+":i.getUTCDate(),"H+":i.getUTCHours(),"m+":i.getUTCMinutes(),"s+":i.getUTCSeconds(),"q+":Math.floor((i.getUTCMonth()+3)/3),S:i.getUTCMilliseconds()}:{"M+":i.getMonth()+1,"d+":i.getDate(),"H+":i.getHours(),"m+":i.getMinutes(),"s+":i.getSeconds(),"q+":Math.floor((i.getMonth()+3)/3),S:i.getMilliseconds()};/(y+)/.test(e)&&(e=e.replace(RegExp.$1,(i[s?"getUTCFullYear":"getFullYear"]()+"").substr(4-RegExp.$1.length)));for(let t in r)new RegExp("("+t+")").test(e)&&(e=e.replace(RegExp.$1,1==RegExp.$1.length?r[t]:("00"+r[t]).substr((""+r[t]).length)));return e}msg(t=e,s="",i="",r){const n=e=>{if(!e)return e;if("string"==typeof e){if(this.isLoon)return e;if(this.isQuanX)return{"open-url":e};if(this.isSurge)return{url:e}}else{if("object"!=typeof e)return;if(this.isLoon){return{openUrl:e.openUrl||e.url||e["open-url"],mediaUrl:e.mediaUrl||e["media-url"]}}if(this.isQuanX){return{"open-url":e["open-url"]||e.url||e.openUrl,"media-url":e["media-url"]||e.mediaUrl}}if(this.isSurge){return{url:e.url||e.openUrl||e["open-url"]}}}};if(this.isMute||(this.isSurge||this.isLoon?$notification.post(t,s,i,n(r)):this.isQuanX&&$notify(t,s,i,n(r))),!this.isMuteLog){let e=["","==============\u{1f4e3}\u7cfb\u7edf\u901a\u77e5\u{1f4e3}=============="];e.push(t),s&&e.push(s),i&&e.push(i),this.log(...e)}}log(...e){e.length>0&&console.log(e.join(this.logSeparator))}logErr(e){this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,e)}wait(e){return new Promise(t=>setTimeout(t,e))}done(e={}){$done(e)}}(e,t)}
