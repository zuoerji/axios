

function Axios() {
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    };
}



function InterceptorManager() {
    // 用来保存拦截器函数的数组, 数组中每个都是对象, 对象中包含fulfilled/rejected方法
    this.handlers = [];
}  



InterceptorManager.prototype.use = function use(fulfilled, rejected) {
    // 添加成功和失败的拦截器函数
    this.handlers.push({
      fulfilled: fulfilled,
      rejected: rejected
    });
    // 返回拦截器对应的ID(也就是下标)
    return this.handlers.length - 1;
}



function querString(str){
    let queryStr = ''
    // 拼接参数
    Object.keys(str).forEach(key=>{
        queryStr += `${key}=${str[key]}&`
    })
    if(queryStr){
        // 除去最后一个 &
        queryStr = '?'+ queryStr.substring(0,queryStr.length-1)
    }
    return queryStr
}


function dispatchRequest(config){
    console.log(config)
    let {url,method,params,data} = config
    // 返回一个 promise对象
    return new Promise((resolve,reject)=>{
        // 处理 method (转成大写)
        method = method.toUpperCase()
        // 1、执行异步ajax 请求
        // 1.1 创建 xhr 对象
        let xhr = null
        if(window.XMLHttpRequest){
            xhr = new XMLHttpRequest()
        }else{
            xhr = new ActiveXObject('Mricosoft.XMLHTTP')
        }
        // 1.2 连接和发送
        if(method==='GET'||method==='DELETE'){
            // let query = querString(params)
            let query =''
            query =params?querString(params):''
            xhr.open(method,url+query)
            xhr.send(null)
        }else if(method==='POST'||method==='PUT'){
            xhr.open(method,url)
            xhr.setRequestHeader("Content-Type", "application/json;charset=utf-8")
            xhr.send(JSON.stringify(data))
        }
        xhr.onreadystatechange = function(){
            // 请求没有完成
            if(xhr.readyState !==4){
                return 
            }
            // 状态码在 200-300 之间 代表成功
            // 2、请求成功，调用 resolve() 
            if(xhr.status >= 200&&xhr.status<=299){
                const response = {
                    data:JSON.parse(xhr.response),
                    status:xhr.status,
                    statusText:xhr.statusText
                }
                resolve(response)
            // 3、请求失败，调用 reject()
            }else{
                reject(new Error('request error status is' + xhr.status))
            }
        }
    })
  }
  
Axios.prototype.request = function(config){

    var chain = [dispatchRequest, undefined];
    var promise = Promise.resolve(config);

    // 后添加的请求拦截器保存在数组的前面
    this.interceptors.request.handlers.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
    });
    // 后添加的响应拦截器保存在数组的后面
    this.interceptors.response.handlers.forEach(function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
    });
    

    // 通过promise的then()串连起所有的请求拦截器/请求方法/响应拦截器
    while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
    }

    // 返回用来指定我们的onResolved和onRejected的promise
    return promise;
}
  
