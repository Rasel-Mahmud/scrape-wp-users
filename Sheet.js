const { GoogleSpreadsheet } = require('google-spreadsheet');
const dotEnv = require('dotenv');
dotEnv.config({path: './.env'})

module.exports = class Sheet {
  constructor(){
    this.doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
  }

  async auth (){
    await this.doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
    });
  }

  async load (){
    await this.doc.loadInfo();
  }

  async addRows(rows){
    const sheet = this.doc.sheetsByIndex[0];
    await sheet.addRows(rows);
  }
}