function init(name, opts) {
  return new (class {
    constructor(name, opts) {
      this.name = name;
      this.isMute = false;
      this.isNeedRewrite = false;
      this.logSeparator = "\n";
      // this.startTime = new Date().getTime();
      Object.assign(this, opts);
      // this.log("", `🔔 ${this.name}, 开始!`);
    }

    get isQuanX() {
      return "undefined" !== typeof $task;
    }

    get isSurge() {
      return "undefined" !== typeof $httpClient && "undefined" === typeof $loon;
    }

    get isLoon() {
      return "undefined" !== typeof $loon;
    }

    toObj(str, defaultValue = null) {
      try {
        return JSON.parse(str);
      } catch (e) {
        // this.logErr(e);
        return defaultValue;
      }
    }

    toStr(obj, defaultValue = null) {
      try {
        if (typeof obj === "number") return String(obj);
        return JSON.stringify(obj);
      } catch (e) {
        return defaultValue;
      }
    }

    read(key) {
      let val;
      if (this.isSurge || this.isLoon) val = $persistentStore.read(key);
      else if (this.isQuanX) val = $prefs.valueForKey(key);
      return this.toObj(val);
    }

    write(val, key) {
      val = this.toStr(val);
      if (this.isSurge || this.isLoon) return $persistentStore.write(val, key);
      else if (this.isQuanX) return $prefs.setValueForKey(val, key);
    }

    get(opts, cb) {
      opts = typeof opts === "string" ? { url: opts } : opts;
      if (opts.headers) {
        delete opts.headers["Content-Type"];
        delete opts.headers["Content-Length"];
      }
      if (this.isSurge || this.isLoon) {
        if (this.isSurge && this.isNeedRewrite) {
          opts.headers = opts.headers || {};
          Object.assign(opts.headers, { "X-Surge-Skip-Scripting": false });
        }
        $httpClient.get(opts, (err, resp, body) => {
          if (!err && resp) {
            resp.body = body;
            resp.statusCode = resp.status;
          }
          cb(err, resp, body);
        });
      } else if (this.isQuanX) {
        if (this.isNeedRewrite) {
          opts.opts = opts.opts || {};
          Object.assign(opts.opts, { hints: false });
        }
        $task.fetch(opts).then(
          resp => {
            const { statusCode: status, statusCode, headers, body } = resp;
            cb(null, { status, statusCode, headers, body }, body);
          },
          err => cb(err)
        );
      }
    }

    post(opts, cb) {
      opts = typeof opts === "string" ? { url: opts } : opts;
      if (opts.body && opts.headers && !opts.headers["Content-Type"]) {
        opts.headers["Content-Type"] = "application/x-www-form-urlencoded";
      }
      if (opts.headers) delete opts.headers["Content-Length"];
      if (this.isSurge || this.isLoon) {
        if (this.isSurge && this.isNeedRewrite) {
          opts.headers = opts.headers || {};
          Object.assign(opts.headers, { "X-Surge-Skip-Scripting": false });
        }
        $httpClient.post(opts, (err, resp, body) => {
          if (!err && resp) {
            resp.body = body;
            resp.statusCode = resp.status;
          }
          cb(err, resp, body);
        });
      } else if (this.isQuanX) {
        opts.method = "POST";
        if (this.isNeedRewrite) {
          opts.opts = opts.opts || {};
          Object.assign(opts.opts, { hints: false });
        }
        $task.fetch(opts).then(
          resp => {
            const { statusCode: status, statusCode, headers, body } = resp;
            cb(null, { status, statusCode, headers, body }, body);
          },
          err => cb(err)
        );
      }
    }

    /**
     * 示例:
     * $.time('yyyy-MM-dd qq HH:mm:ss.S')
     * $.time('yyyyMMddHHmmssS')
     * y:年 M:月 d:日 q:季 H:时 m:分 s:秒 S:毫秒
     * 其中y可选0-4位占位符、S可选0-1位占位符，其余可选0-2位占位符
     * @param {string} 可选: fmt 格式化参数
     * @param {number} 可选: 根据指定时间戳返回格式化日期
     */
    time(fmt, ts = null, utc = false) {
      if (!fmt) return ts || new Date().getTime();
      const date = ts ? new Date(ts) : new Date();
      let o = utc
        ? {
            "M+": date.getUTCMonth() + 1,
            "d+": date.getUTCDate(),
            "H+": date.getUTCHours(),
            "m+": date.getUTCMinutes(),
            "s+": date.getUTCSeconds(),
            "q+": Math.floor((date.getUTCMonth() + 3) / 3),
            S: date.getUTCMilliseconds()
          }
        : {
            "M+": date.getMonth() + 1,
            "d+": date.getDate(),
            "H+": date.getHours(),
            "m+": date.getMinutes(),
            "s+": date.getSeconds(),
            "q+": Math.floor((date.getMonth() + 3) / 3),
            S: date.getMilliseconds()
          };
      if (/(y+)/.test(fmt))
        fmt = fmt.replace(
          RegExp.$1,
          (date[utc ? "getUTCFullYear" : "getFullYear"]() + "").substr(
            4 - RegExp.$1.length
          )
        );
      for (let k in o)
        if (new RegExp("(" + k + ")").test(fmt))
          fmt = fmt.replace(
            RegExp.$1,
            RegExp.$1.length == 1
              ? o[k]
              : ("00" + o[k]).substr(("" + o[k]).length)
          );
      return fmt;
    }

    /**
     * 系统通知
     *
     * > 通知参数: 同时支持 QuanX 和 Loon 两种格式, EnvJs根据运行环境自动转换, Surge 环境不支持多媒体通知
     *
     * 示例:
     * $.msg(title, subt, desc, 'twitter://')
     * $.msg(title, subt, desc, { 'open-url': 'twitter://', 'media-url': 'https://github.githubassets.com/images/modules/open_graph/github-mark.png' })
     * $.msg(title, subt, desc, { 'open-url': 'https://bing.com', 'media-url': 'https://github.githubassets.com/images/modules/open_graph/github-mark.png' })
     *
     * @param {*} title 标题
     * @param {*} subt 副标题
     * @param {*} desc 通知详情
     * @param {*} opts 通知参数
     *
     */
    msg(title = name, subt = "", desc = "", opts) {
      const toEnvOpts = rawopts => {
        if (!rawopts) return rawopts;
        if (typeof rawopts === "string") {
          if (this.isLoon) return rawopts;
          else if (this.isQuanX) return { "open-url": rawopts };
          else if (this.isSurge) return { url: rawopts };
        } else if (typeof rawopts === "object") {
          if (this.isLoon) {
            let openUrl = rawopts.openUrl || rawopts.url || rawopts["open-url"];
            let mediaUrl = rawopts.mediaUrl || rawopts["media-url"];
            return { openUrl, mediaUrl };
          } else if (this.isQuanX) {
            let openUrl = rawopts["open-url"] || rawopts.url || rawopts.openUrl;
            let mediaUrl = rawopts["media-url"] || rawopts.mediaUrl;
            return { "open-url": openUrl, "media-url": mediaUrl };
          } else if (this.isSurge) {
            let openUrl = rawopts.url || rawopts.openUrl || rawopts["open-url"];
            return { url: openUrl };
          }
        } else {
          return undefined;
        }
      };
      if (!this.isMute) {
        if (this.isSurge || this.isLoon) {
          $notification.post(title, subt, desc, toEnvOpts(opts));
        } else if (this.isQuanX) {
          $notify(title, subt, desc, toEnvOpts(opts));
        }
      }
      if (!this.isMuteLog) {
        let logs = ["", "==============📣系统通知📣=============="];
        logs.push(title);
        subt && logs.push(subt);
        desc && logs.push(desc);
        this.log(...logs);
      }
    }

    log(...logs) {
      if (logs.length > 0) {
        console.log(logs.join(this.logSeparator));
      }
    }

    logErr(err) {
      this.log("", `❗️${this.name}, 错误!`, err);
    }

    wait(time) {
      return new Promise(resolve => setTimeout(resolve, time));
    }

    done(value = {}) {
      // const endTime = new Date().getTime();
      // const costTime = (endTime - this.startTime) / 1000;
      // this.log("", `🔔${this.name}, 结束! 🕛 ${costTime} 秒`);
      $done(value);
    }
  })(name, opts);
}
