const { google } = require('googleapis');
require('dotenv').config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const getSheets = async () => {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  return sheets;
};

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

const getNextId = async (aba) => {
  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${aba}!A:A`,
  });

  const rows = response.data.values;
  if (!rows || rows.length <= 1) {
    return 1;
  }

  const ids = rows.slice(1)
    .map(row => parseInt(row[0]))
    .filter(id => !isNaN(id));

  if (ids.length === 0) return 1;

  return Math.max(...ids) + 1;
};

const findRowById = async (aba, id) => {
  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${aba}!A:A`,
  });

  const rows = response.data.values;
  if (!rows) return -1;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      return i + 1;
    }
  }
  return -1;
};

module.exports = { getSheets, SPREADSHEET_ID, getNextId, findRowById };