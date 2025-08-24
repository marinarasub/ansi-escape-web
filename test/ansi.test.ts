import { ansiToHtml, ansiToPlain } from "../src/core/ansi";

describe("ansiToHtml", () => {
  it("converts red ANSI to HTML span", async () => {
    const input = "\x1b[31mRed\x1b[0m";
    const result = await ansiToHtml(input);
    expect(result).toBe('<span style="color:#ff4d4f;">Red</span>');
  });

  it("escapes HTML in input", async () => {
    const input = "<b>\x1b[31mRed\x1b[0m</b>";
    const result = await ansiToHtml(input);
    expect(result).toBe('&lt;b&gt;<span style="color:#ff4d4f;">Red</span>&lt;/b&gt;');
  });

  it("handles bold and gray", async () => {
    const input = "\x1b[1mBold\x1b[22m and \x1b[90mGray\x1b[0m";
    const result = await ansiToHtml(input);
    expect(result).toBe('<span style="font-weight:bold;">Bold</span><span style="font-weight:normal;"> and </span><span style="color:#bfbfbf;font-weight:normal;">Gray</span>');
  });
});

describe("ansiToPlain", () => {
  it("removes standard ANSI codes", async () => {
    const input = "\x1b[31mRed\x1b[0m";
    const result = await ansiToPlain(input);
    expect(result).toBe("Red");
  });

  it("removes bold, underline, and italics", async () => {
    const input = "\x1b[1mBold\x1b[22m \x1b[3mItalic\x1b[23m \x1b[4mUnder\x1b[24m";
    const result = await ansiToPlain(input);
    expect(result).toBe("Bold Italic Under");
  });

  it("removes 8-bit color codes", async () => {
    const input = "\x1b[38;5;196mRed8bit\x1b[0m";
    const result = await ansiToPlain(input);
    expect(result).toBe("Red8bit");
  });

  it("removes true color codes", async () => {
    const input = "\x1b[38;2;255;0;0mRedTrue\x1b[0m";
    const result = await ansiToPlain(input);
    expect(result).toBe("RedTrue");
  });

  it("handles mixed sequences", async () => {
    const input = "\x1b[1;31mBoldRed\x1b[0m Normal \x1b[4;38;5;46mUnderGreen8bit\x1b[0m";
    const result = await ansiToPlain(input);
    expect(result).toBe("BoldRed Normal UnderGreen8bit");
  });

  it("returns plain text if no ANSI", async () => {
    const input = "Hello, world!";
    const result = await ansiToPlain(input);
    expect(result).toBe("Hello, world!");
  });
});
