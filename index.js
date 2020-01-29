const _ = require('lodash')
const fs = require('fs')
const csv = require('csvtojson')
const filePath = './input.csv'

getJsonFromCsv = async filePath => (csv({
  noheader: true,
  headers: [
    'fullName', 
    'eId', 
    'class1', 
    'class2', 
    'address1', 
    'address2', 
    'address3', 
    'address4', 
    'address5', 
    'address6', 
    'invisible', 
    'seeAll'
  ]
}).fromFile(filePath).then(json => json))

const main = async () => {
  const json = await getJsonFromCsv(filePath)
  const data = _.without(json, json[0])
  const headers = json[0]

  const groupedByName = _.groupBy(data, 'fullName')
  const names = _.map(groupedByName, (name, key) => key)

  _.map(names, name => {
    const student = { 
      fullName: undefined, 
      eId: undefined,
      classes: [],
      addresses: { address1: [], address2: [], address3: [], address4: [], address5: [], address6: [] },
      invisible: undefined, 
      seeAll: undefined
    }
    const { fullName, eId, invisible, seeAll } = groupedByName[name][0]

    student.fullName = fullName || undefined
    student.eId = eId || undefined
    student.invisible = invisible || undefined
    student.seeAll = seeAll || undefined

    _.map(groupedByName[name], info => {
      const { class1, class2, address1, address2, address3, address4, address5, address6 } = info
      if (class1) student.classes.push(class1)
      if (class2) student.classes.push(class2)

      const addresses = { address1, address2, address3, address4, address5, address6 }
      _.map(Object.entries(addresses), entry => {
        const key = entry[0]
        const value = entry[1]
        if (value) student.addresses[key].push(value)
      })
    })
    console.log(student)
  })
}

main()
