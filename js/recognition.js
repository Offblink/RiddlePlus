// recognition.js — Google IME handwriting recognition
var RP = window.RP || {};

RP.recognizeHandwriting = function(trace, language, cssW, cssH) {
  return new Promise(function(resolve, reject) {
    var data = JSON.stringify({
      "options": "enable_pre_space",
      "requests": [{
        "writing_guide": {
          "writing_area_width": cssW || undefined,
          "writing_area_height": cssH || undefined
        },
        "ink": trace,
        "language": language || "zh_CN"
      }]
    });

    var xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            var resp = JSON.parse(xhr.responseText);
            if (resp.length === 1) reject(new Error(resp[0]));
            else resolve((resp[1][0][1] || [])[0] || null);
          } catch (e) {
            reject(new Error('解析识别结果失败'));
          }
        } else if (xhr.status === 403) {
          reject(new Error('Google 拒绝访问（可能需要 fān qiáng）'));
        } else if (xhr.status === 503) {
          reject(new Error('无法连接识别服务器'));
        } else {
          reject(new Error('识别服务错误 (' + xhr.status + ')'));
        }
      }
    });

    xhr.open("POST", "https://www.google.com.tw/inputtools/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8");
    xhr.setRequestHeader("content-type", "application/json");
    xhr.send(data);
  });
};
