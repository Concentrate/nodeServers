/**
 * Created by liudeyu on 2018/4/4.
 */
'use strict'
var mysql = require("mysql")
const util = require("util")
const DatabaseUtil = require("../util/DatabaseUtils")
const CommonHelpFun = require("../util/CommonHelpUtils")
const RecommendDataHelper = require("../util/RecommondDataHelper")
var allData = [];
const PAGE = "page";
const AUTHEN = "authen";
const ACCOUNT_ID = "account_id";
const allnews_reflash_page_count = 200;
const TIME_GAP = 60 * 1000;
const every_page_num = 20;

async function updateData() {
    var selectSql = `select * from toutiao_news  order by behot_time desc limit %s;`;
    // 这里选择出来的item_id,和数据库里面的item_id不一致，不知道为什么，group_id倒是一致
    selectSql = util.format(selectSql, allnews_reflash_page_count + "")
    DatabaseUtil.findNewsData(selectSql).then(function (data) {
        allData = data
        // console.log(allData)
        console.log("all result data length is %d", allData.length)
    })

}
setInterval(updateData, TIME_GAP)
// updateData()
async function getRecomendData(ctx, next) {
    console.log("开始处理请求连接为 " + ctx.url)
    ctx.type = "application/json";
    var response = {};
    var querys = ctx.query;
    var page = 0;
    var user_id;
    if (querys) {
        var tmp = querys[PAGE]
        if (CommonHelpFun.isNum(tmp)) {
            page = parseInt(tmp)
        }
        user_id = querys[ACCOUNT_ID]
    }
    response["status"] = "ok"
    var recommendDatas=[];
    if (user_id) {
        recommendDatas = RecommendDataHelper.getRecommondData({user_id: user_id, timestamp: new Date().getTime()})
    }
  if(recommendDatas){
    console.log("展示给用户的数据，推荐数据数量为%d",recommendDatas.length)
    }
    var resultData = []
    if (recommendDatas && recommendDatas.length > 0) {
        recommendDatas.forEach(item => {
            resultData.push(item)
        })
    }
    if (resultData.length < every_page_num) {
        var leftNum = every_page_num - resultData.length
        if (allData && (page + 1) * leftNum < allData.length) {
            allData.slice(page * leftNum, page * leftNum + leftNum).forEach(item => {
                resultData.push(item)
            })
        }
    } else {
        resultData = resultData.slice(0, every_page_num)
    }
    response["data"] = resultData
    ctx.body = response
    await next()
}
module.exports = {
    "get /feed/all_news": getRecomendData
}
