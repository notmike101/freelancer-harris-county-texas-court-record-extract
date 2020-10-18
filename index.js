const axios = require('axios')
const { parse, stringify } = require('csv')
const { promisify } = require('util')
const dayjs = require('dayjs')
const fs = require('fs')

const p_parse = promisify(parse)

///////// CONFIGURATION /////////
const config = {
  startDate: dayjs('2000-01-01'),
  endDate: dayjs('2018-12-31'),
  dateStep: 30,
  outFile: './data.csv',
  courtIds: [
    305,
    310,
    315,
    320,
    325,
    330,
    335,
    340,
    345,
    350,
    355,
    360,
    365,
    370,
    375,
    380
  ]
}
///////// END CONFIGURATION /////////

async function getCSV(startDate, endDate, courtId = 305) {
  try {
    startDate = startDate.replace(/\//gim, '%2F')
    endDate = endDate.replace(/\//gim, '%2F')

    const csvURL = `https://jpwebsite.harriscountytx.gov/PublicExtracts/GetExtractData?extractCaseType=CV&extract=1&court=${courtId}&casetype=EV&format=csv&fdate=${startDate}&tdate=${endDate}`

    const res = await axios.get(csvURL)
    const data = res.data

    return await p_parse(data, {
      skip_lines_with_error: true,
      columns: true
    })
  } catch (err) {
    throw new Error(err)
  }
}

function writeCSV(data = [], outputLocation = './data.csv', append = false) {
  const outFile = fs.createWriteStream(outputLocation, {
    flags: append ? 'a' : 'w'
  })

  stringify(data, {
    header: !append,
  }).pipe(outFile)
}

async function main() {
  let currentDate = config.startDate

  while(currentDate.isBefore(config.endDate)) {
    const start = currentDate.format('MM/DD/YYYY')
    currentDate = currentDate.add(config.dateStep, 'days')
    let end = currentDate.format('MM/DD/YYYY')

    if (currentDate.isAfter(config.endDate)) {
      end = config.endDate.format('MM/DD/YYYY')
    }

    const append = start !== config.startDate.format('MM/DD/YYYY')

    for (courtId of config.courtIds) {
      console.log({
        start,
        end,
        courtId
      })

      const data = await getCSV(start, end, courtId)

      writeCSV(data, config.outFile, append)
    }
  }
}

main()
