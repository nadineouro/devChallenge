const _ = require('lodash')
const fs = require('fs')
const csv = require('csvtojson')
const filePath = './input.csv'
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const PNF = require('google-libphonenumber').PhoneNumberFormat

const getJsonFromCsv = async filePath => (csv({
  noheader: true,
  headers: [
    'fullname', 'eid', 'class1', 'class2', 'address1', 'address2', 
    'address3', 'address4', 'address5', 'address6', 'invisible', 'see_all'
  ]
}).fromFile(filePath).then(json => json))

const saveJSONFile = arrayClass =>
  fs.writeFile("output.json", JSON.stringify(arrayClass), err => 
    err ? console.log(err) : console.log('JSON file saved!'))

const handleClass = (student, _class) => {
  const formattedClass = replaceSlash(_class)
  const arrayClass = formattedClass.split(',')
  _.map(arrayClass, cl => cl && student.push(cl.trim()))
  return student.length === 1 ? student[0] : student
}

const handleAddresses = (mainAddresses, addrs) => {
  _.map(Object.entries(addrs), ([key, value]) => {
    if (value) { 
      const formattedAddr = clearWhiteSpaces(replaceSlash(value))
      const arrayAddr = formattedAddr.split(',')
      _.map(arrayAddr, addr => addr && mainAddresses[key].push(addr))
    }
  })
  return mainAddresses
}

const handleSeeAll = (student, seeAll) => !student ? (seeAll === 'yes' ? true : false) : student

const handleInvisible = (student, invisible) => !student ? (invisible === '1' ? true : false) : student


const formatAddrResult = (headerName, address, headers) => { 
  const addrHeader  = _.find(headers, ([key, value]) => key === headerName)
  const keyWords = (clearCommas(addrHeader[1])).split(' ')
  const type = keyWords[0]
  const tags = _.without(keyWords, keyWords[0])
  if (address.length > 0) {
    _.map(address, addr => {
      const obj = { type, tags, address: undefined }
      let isValid = true
      switch (obj.type) {
        case 'phone': 
          isValid = validatePhone(addr)
          if (isValid) obj.address = isValid
          break
        case 'email':
          isValid = validateEmail(addr)
          if (isValid) obj.address = addr
          break
        default: 
          isValid = addr.length < 0 ? false : true
          break
      }
      if (isValid) {
        addresses = [] 
        addresses.push(obj)
      }
    }) 
  }
  return addresses
}

const validateEmail = email => {
  const expression = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return(expression.test(String(email).toLowerCase()))
}

const validatePhone = phone => {
  try {
    let number = phoneUtil.parse(phone, 'BR');
    if (phoneUtil.isValidNumberForRegion(number, 'BR')) {
      res = phoneUtil.format(number, PNF.E164).replace('+', '')
      return res
    }
  } catch (e) {
    return false
  }
}

const replaceSlash = str => str.replace(/\//g, ',')
const clearCommas = str => str.split(',').join('')
const clearWhiteSpaces = str => str.split(' ').join('')

const main = async () => {
  const json = await getJsonFromCsv(filePath)
  const data = _.without(json, json[0])

  const { address1, address2, address3, address4, address5, address6 } = json[0]
  const addrHeaders = Object.entries({ address1, address2, address3, address4, address5, address6 })

  const groupedByName = _.groupBy(data, 'fullname')
  const names = _.map(groupedByName, (name, key) => key)
  const studentList = []
  let mainAddresses = { address1: [], address2: [], address3: [], address4: [], address5: [], address6: [] }

  _.map(names, name => {
    const student = { 
      fullname: undefined, 
      eid: undefined,
      classes: [],
      addresses: [],
      invisible: undefined, 
      see_all: undefined
    }
    const { fullname, eid } = groupedByName[name][0]

    student.fullname = fullname || undefined
    student.eid = eid || undefined

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
      mainAddresses = handleAddresses(mainAddresses, addresses)
    })
    student.addresses = []
    _.map(Object.entries(mainAddresses), ([key, value]) => {
      if (value.length > 0) {
        const res = formatAddrResult(key, value, addrHeaders)
        _.map(res, addr => student.addresses.push(addr))
      }
    })
    studentList.push(student)
  })
  saveJSONFile(studentList)
}
main()
