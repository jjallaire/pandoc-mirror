import extension from "./em"

test('basic', () => {
    for (let mark of extension.marks!) {
        if (mark.name == "em") {
            let spec = mark.spec;
        }
    }
});
