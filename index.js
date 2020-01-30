const _ = require('lodash')
const fs = require('fs')
const csv = require('csvtojson')
const filePath = './input.csv'

getJsonFromCsv = async filePath => (csv({
  noheader: true,
  headers: [
    'fullname', 'eid', 'class1', 'class2', 'address1', 'address2', 
    'address3', 'address4', 'address5', 'address6', 'invisible', 'see_all'
  ]
}).fromFile(filePath).then(json => json))

const replaceSlash = str => str.replace(/\//g, ',')
const clearCommas = str => str.split(',').join('')
const clearWhiteSpaces = str => str.split(' ').join('')

const handleClass = (student, cl) => {
  const formattedClass = replaceSlash(cl)
  const arr = formattedClass.split(',')
  _.map(arr, c => c && student.push(c.trim()))
  return student.length === 1 ? student[0] : student
}

const handleAddresses = (student, addresses) => {
  _.map(Object.entries(addresses), ([key, value]) => {
    if (value) { 
      const formattedAddr = clearWhiteSpaces(replaceSlash(value))
      const arr = formattedAddr.split(',')
      _.map(arr, a => a && student[key].push(a))
    }
  })
  return student
}

const handleSeeAll = (student, seeAll) => !student ? (seeAll === 'yes' ? true : false) : student
const handleInvisible = (student, invisible) => !student ? (invisible === '1' ? true : false) : student

const format = (headerName, address, headers) => { 
  const header  = _.find(headers, ([key, value]) => key === headerName)
  const keyWords = (clearCommas(header[1])).split(' ')
  const type = keyWords[0]
  const tags = _.without(keyWords, keyWords[0])
  const obj = { type, tags, address }
  /* if (address.length > 0)  */return obj 
}

const main = async () => {
  const json = await getJsonFromCsv(filePath)
  const data = _.without(json, json[0])

  const { address1, address2, address3, address4, address5, address6 } = json[0]
  const addrHeaders = Object.entries({ address1, address2, address3, address4, address5, address6 })

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
    const { fullname, eid/* , invisible, see_all */ } = groupedByName[name][0]

    student.fullname = fullname || undefined
    student.eid = eid || undefined
    // student.invisible = invisible || undefined
    // student.see_all = see_all || undefined

    _.map(groupedByName[name], info => {
      const { class1, class2, address1, address2, address3, address4, address5, address6, invisible, see_all } = info

      student.invisible = handleInvisible(student.invisible, invisible)
      student.see_all = handleSeeAll(student.see_all, see_all)

      student.classes = handleClass(student.classes, `${class1},${class2}`)

      const addresses = { 
        address1: address1 || undefined, 
        address2: address2 || undefined, 
        address3: address3 || undefined, 
        address4: address4 || undefined, 
        address5: address5 || undefined, 
        address6: address6 || undefined
      }
      student.addresses = handleAddresses(student.addresses, addresses)
    })
    student.addresses = _.map(Object.entries(student.addresses), ([key, value]) => {
      const res = format(key, value, addrHeaders)
      if (res) return res
    })
    studentList.push(student)
    console.log(student)
  })
}
main()
