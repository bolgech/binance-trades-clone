/******************************
 *              https://github.com/binance-exchange/node-binance-api
 *              npm install -s node-binance-api
 *              https://github.com/binance/binance-spot-api-docs/blob/master/rest-api.md
 *              https://binance-docs.github.io/apidocs/spot/en/#change-log
 * ***********************************/
const dotenv =  require('dotenv');
const result = dotenv.config();
/*if (result.error) {
    throw result.error
}*/
const Binance = require('node-binance-api');
const binance = new Binance().options({});
const sourceBinance = new Binance().options({
    APIKEY: "cjIqPofXH9DcJK0Sf1aQPrXeiEUrUI7DkudCPIt0sbXJssXiaUdKNwBYGiEvhbsf",
    APISECRET: "lqhUNXSZDpubvDeDR0fo9AWs3pCpN6ADf5EIAJX8XDkKlfQ4m14M4bSXcvXzJ32Y"
});
const targetBinance = new Binance().options({
    APIKEY: "CPiQ4QdKjOcJhoAMLLdF1FxluEMxyxaZpS7Lblstr00ZWa1wgQ6OhBG9WJdb1MaH",
    APISECRET: "9Fk95moCSSIC3i43MHnSOthXU3gza4FGJpsE3neOD4b6AULbB3kHABtjb6R7o6VN"
});

async function getExchangeInfo(){
    try{
        const info = await binance.exchangeInfo();
        const symbols = info.symbols.map(({baseAsset,quoteAsset})=>`${baseAsset}/${quoteAsset}`)
        const quoteAssets = Array.from(new Set(info.symbols.map(({quoteAsset})=>quoteAsset)));
        return Promise.resolve({symbols, quoteAssets, info});
    }catch (err){
        return Promise.reject(err)
    }
}
/*
* {
  "e": "executionReport",        // Event type
  "E": 1499405658658,            // Event time
  "s": "ETHBTC",                 // Symbol
  "c": "mUvoqJxFIILMdfAW5iGSOW", // Client order ID
  "S": "BUY",                    // Side
  "o": "LIMIT",                  // Order type
  "f": "GTC",                    // Time in force
  "q": "1.00000000",             // Order quantity
  "p": "0.10264410",             // Order price
  "P": "0.00000000",             // Stop price
  "F": "0.00000000",             // Iceberg quantity
  "g": -1,                       // OrderListId
  "C": null,                     // Original client order ID; This is the ID of the order being canceled
  "x": "NEW",                    // Current execution type
  "X": "NEW",                    // Current order status
  "r": "NONE",                   // Order reject reason; will be an error code.
  "i": 4293153,                  // Order ID
  "l": "0.00000000",             // Last executed quantity
  "z": "0.00000000",             // Cumulative filled quantity
  "L": "0.00000000",             // Last executed price
  "n": "0",                      // Commission amount
  "N": null,                     // Commission asset
  "T": 1499405658657,            // Transaction time
  "t": -1,                       // Trade ID
  "I": 8641984,                  // Ignore
  "w": true,                     // Is the order on the book?
  "m": false,                    // Is this trade the maker side?
  "M": false,                    // Ignore
  "O": 1499405658657,            // Order creation time
  "Z": "0.00000000",             // Cumulative quote asset transacted quantity
  "Y": "0.00000000",              // Last quote asset transacted quantity (i.e. lastPrice * lastQty)
  "Q": "0.00000000"              // Quote Order Qty
}
* Execution types:

NEW - The order has been accepted into the engine.
CANCELED - The order has been canceled by the user.
REPLACED (currently unused)
REJECTED - The order has been rejected and was not processed. (This is never pushed into the User Data Stream)
TRADE - Part of the order or all of the order's quantity has filled.
EXPIRED - The order was canceled according to the order type's rules (e.g. LIMIT FOK orders with no fill, LIMIT IOC or MARKET orders that partially fill) or by the exchange, (e.g. orders canceled during liquidation, orders canceled during maintenance)
* */
async function executionReport(data){
    const {
        i:orderId,
        S:side,
        X:order_status,
        s:symbol,
        p:price,
        q:quantity,
        o:order_type,
        P:stop_price,
    } = data;
    //console.log(data);
    if(order_status!=='NEW'){
        return;
    }
    try {
        if(side==='BUY'&&order_type==='LIMIT'){
            await targetBinance.buy(symbol,quantity,price)
        }
        if(side==='BUY'&&order_type!=='LIMIT'){
            await targetBinance.marketBuy(symbol,quantity)
        }

        if(side==='SELL'&&order_type==='LIMIT'){
            await targetBinance.sell(symbol,quantity,price)
        }
        if(side==='SELL'&&order_type!=='LIMIT'){
            await targetBinance.marketSell(symbol,quantity)
        }

    }catch (err){
        console.log(err)
    }
}

/*
* {
  "e": "listStatus",                //Event Type
  "E": 1564035303637,               //Event Time
  "s": "ETHBTC",                    //Symbol
  "g": 2,                           //OrderListId
  "c": "OCO",                       //Contingency Type
  "l": "EXEC_STARTED",              //List Status Type
  "L": "EXECUTING",                 //List Order Status
  "r": "NONE",                      //List Reject Reason
  "C": "F4QN4G8DlFATFlIUQ0cjdD",    //List Client Order ID
  "T": 1564035303625,               //Transaction Time
  "O": [                            //An array of objects
    {
      "s": "ETHBTC",                //Symbol
      "i": 17,                      // orderId
      "c": "AJYsMjErWJesZvqlJCTUgL" //ClientOrderId
    },
    {
      "s": "ETHBTC",
      "i": 18,
      "c": "bfYPSQdLoqAJeNrOr9adzq"
    }
  ]
}
* */
function listStatus(data){
    console.log(data);
}
function outboundAccountPosition(data){
    console.log(data);
}
function parseBalance(balance){
    return Object.entries(balance)
        .filter(([key,{available}])=>parseFloat(available)>0)
        .reduce((a,[key, data])=>{a[key]=parseFloat(data.available); return a},{});
}
(async function main(){
   try{
  //     let info = await getExchangeInfo()
       let balance_source = await sourceBinance.balance();
       balance_source = parseBalance(balance_source);
      // console.log(balance_source);
  //     let balance_target = await targetBinance.balance();
  //    balance_target = parseBalance(balance_target);

   //    console.log(balance_target);
       sourceBinance.websockets.userData(outboundAccountPosition,executionReport,(data)=>{
           if(!data){
               return console.log('Not subscribed!')
           }
           console.log(`Was subscribed success`)

       },listStatus);
   }catch (err){
       console.log(err);
   }
})()