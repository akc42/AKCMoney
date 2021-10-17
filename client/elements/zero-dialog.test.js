const rewire = require("rewire")
const zero_dialog = rewire("./zero-dialog")
const ZeroDialog = zero_dialog.__get__("ZeroDialog")
// @ponicode
describe("connectedCallback", () => {
    let inst

    beforeEach(() => {
        inst = new ZeroDialog()
    })

    test("0", () => {
        let callFunction = () => {
            inst.connectedCallback()
        }
    
        expect(callFunction).not.toThrow()
    })
})

// @ponicode
describe("disconnectedCallback", () => {
    let inst

    beforeEach(() => {
        inst = new ZeroDialog()
    })

    test("0", () => {
        let callFunction = () => {
            inst.disconnectedCallback()
        }
    
        expect(callFunction).not.toThrow()
    })
})

// @ponicode
describe("firstUpdated", () => {
    let inst

    beforeEach(() => {
        inst = new ZeroDialog()
    })

    test("0", () => {
        let callFunction = () => {
            inst.firstUpdated()
        }
    
        expect(callFunction).not.toThrow()
    })
})

// @ponicode
describe("render", () => {
    let inst

    beforeEach(() => {
        inst = new ZeroDialog()
    })

    test("0", () => {
        let callFunction = () => {
            inst.render()
        }
    
        expect(callFunction).not.toThrow()
    })
})

// @ponicode
describe("_dialogClosed", () => {
    let inst

    beforeEach(() => {
        inst = new ZeroDialog()
    })

    test("0", () => {
        let callFunction = () => {
            inst._dialogClosed(1)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction = () => {
            inst._dialogClosed(0)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let callFunction = () => {
            inst._dialogClosed(100)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let callFunction = () => {
            inst._dialogClosed(-100)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let callFunction = () => {
            inst._dialogClosed(-5.48)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("5", () => {
        let callFunction = () => {
            inst._dialogClosed(NaN)
        }
    
        expect(callFunction).not.toThrow()
    })
})

// @ponicode
describe("_gotRequest", () => {
    let inst

    beforeEach(() => {
        inst = new ZeroDialog()
    })

    test("0", () => {
        let callFunction = () => {
            inst._gotRequest({ stopPropagation: () => "2021-07-29T15:31:46.922Z", composedPath: () => "/path/to/file" })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction = () => {
            inst._gotRequest({ stopPropagation: () => "2021-07-30T00:05:36.818Z", composedPath: () => "/path/to/file" })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let callFunction = () => {
            inst._gotRequest({ stopPropagation: () => "2021-07-30T00:05:36.818Z", composedPath: () => "path/to/file.ext" })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let callFunction = () => {
            inst._gotRequest({ stopPropagation: () => "2021-07-29T23:03:48.812Z", composedPath: () => "path/to/file.ext" })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let callFunction = () => {
            inst._gotRequest({ stopPropagation: () => "2021-07-29T23:03:48.812Z", composedPath: () => "./path/to/file" })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("5", () => {
        let callFunction = () => {
            inst._gotRequest(undefined)
        }
    
        expect(callFunction).not.toThrow()
    })
})

// @ponicode
describe("_replyToCaller", () => {
    let inst

    beforeEach(() => {
        inst = new ZeroDialog()
    })

    test("0", () => {
        let callFunction = () => {
            inst._replyToCaller({ stopPropagation: () => "2021-07-29T15:31:46.922Z" })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction = () => {
            inst._replyToCaller({ stopPropagation: () => "2021-07-29T17:54:41.653Z" })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let callFunction = () => {
            inst._replyToCaller({ stopPropagation: () => "2021-07-30T00:05:36.818Z" })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let callFunction = () => {
            inst._replyToCaller({ stopPropagation: () => "2021-07-29T23:03:48.812Z" })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let callFunction = () => {
            inst._replyToCaller({ stopPropagation: () => "2021-07-29T20:12:53.196Z" })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("5", () => {
        let callFunction = () => {
            inst._replyToCaller(undefined)
        }
    
        expect(callFunction).not.toThrow()
    })
})
