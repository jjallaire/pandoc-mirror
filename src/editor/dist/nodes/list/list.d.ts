import { Extension } from 'editor/api/extension';
export declare enum ListNumberStyle {
    DefaultStyle = "DefaultStyle",
    Decimal = "Decimal",
    LowerRoman = "LowerRoman",
    UpperRoman = "UpperRoman",
    LowerAlpha = "LowerAlpha",
    UpperAlpha = "UpperAlpha",
    Example = "Example"
}
export declare enum ListNumberDelim {
    DefaultDelim = "DefaultDelim",
    Period = "Period",
    OneParen = "OneParen",
    TwoParens = "TwoParens"
}
declare const extension: Extension;
export default extension;
