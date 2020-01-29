const _ = require('lodash')
const fs = require('fs')
const csv = require('csvtojson')
const filePath = './input.csv'

getJsonFromCsv = async filePath => (csv({
  noheader: true,
  headers: [
    'fullname', 
    'eid', 
    'class1', 
    'class2', 
    'address1', 
    'address2', 
    'address3', 
    'address4', 
    'address5', 
    'address6', 
    'invisible', 
    'see_all'
  ]
}).fromFile(filePath).then(json => json))

const parseSlashOnComma = str => str.replace(/\//g, ',')

const handleClass = (student, cl) => {
  formatedClass = parseSlashOnComma(cl)
  const arr = formatedClass.split(',')
  _.map(arr, c => c && student.push(c.trim()))
  return student.length === 1 ? student[0] : student
}

const main = async () => {
  const json = await getJsonFromCsv(filePath)
  const data = _.without(json, json[0])
  const headers = json[0]

  const groupedByName = _.groupBy(data, 'fullname')
  const names = _.map(groupedByName, (name, key) => key)
  const studentList = []

  _.map(names, name => {
    const student = { 
      fullname: undefined, 
      eid: undefined,
      classes: [],
      addresses: { address1: [], address2: [], address3: [], address4: [], address5: [], address6: [] },
      invisible: undefined, 
      see_all: undefined
    }
    const { fullname, eid, invisible, see_all } = groupedByName[name][0]

    student.fullname = fullname || undefined
    student.eid = eid || undefined
    student.invisible = invisible || undefined
    student.see_all = see_all || undefined

    _.map(groupedByName[name], info => {
      const { class1, class2, address1, address2, address3, address4, address5, address6 } = info
      student.classes = handleClass(student.classes, `${class1},${class2}`)
      const addresses = { address1, address2, address3, address4, address5, address6 }
      _.map(Object.entries(addresses), entry => {
        const key = entry[0]
        const value = entry[1]
        if (value) student.addresses[key].push(value)
      })
    })
    studentList.push(student)
    console.log(student)
  })
  // console.log(studentList)
}
main()
