import React, { useState, useRef, useEffect } from "react";
import { Layout, Typography, Row, Col, Input, Card, Button, Space, message, Dropdown } from "antd";
import { UploadOutlined, CopyOutlined, DownloadOutlined, DownOutlined, SnippetsOutlined } from "@ant-design/icons";
const { Title, Paragraph } = Typography;
const { TextArea } = Input;
import { ansiToHtml, ansiToPlain } from "../core/ansi";

type OutputType = "orig" | "plain" | "html";

function AnsiOutput({ input }: { input: string }) {
  const [html, setHtml] = useState('');
  useEffect(() => {
    (async () => {
      setHtml(await ansiToHtml(input));
    })();
  }, [input]);

  return (
    <div
      style={{
        minHeight: 200,
        background: "#1e1e1e",
        color: "#fff",
        padding: 16,
        fontFamily: "monospace",
        whiteSpace: "pre-wrap",
        borderRadius: 4,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function HomePage() {
  const [input, setInput] = useState("");
  const [outputType, setOutputType] = useState<OutputType>("plain");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setInput(event.target?.result as string);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch {
      message.error("Paste failed.");
    }
  };

  const handleCopy = async () => {
    try {
      if (outputType === "orig") {
        await navigator.clipboard.writeText(input);
      } else if (outputType === "plain") {
        await navigator.clipboard.writeText(await ansiToPlain(input));
      } else {
        await navigator.clipboard.writeText(await ansiToHtml(input));
      }
      message.success("Copied to clipboard!");
    } catch {
      message.error("Copy failed.");
    }
  };

  const handleDownload = async () => {
    let blob: Blob, filename: string;
    if (outputType === "plain") {
      blob = new Blob([await ansiToPlain(input)], { type: "text/plain" });
      filename = "ansi-output.txt";
    } else if (outputType === "orig") {
      blob = new Blob([input], { type: "text/plain" });
      filename = "ansi-output.txt";
    } else {
      blob = new Blob(
        [
          `<pre style="background:#1e1e1e;color:#fff;padding:16px;font-family:monospace;white-space:pre-wrap;border-radius:4px;">
          ${await ansiToHtml(input)}</pre>`,
        ],
        { type: "text/html" }
      );
      filename = "ansi-output.html";
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const dropdownItems = [
    { key: "plain", label: "Plain Text" },
    { key: "html", label: "HTML" },
    { key: "orig", label: "Original" },
  ];

  return (
    <Layout style={{ width: "100%", padding: 24 }}>
      <Row justify="center" style={{ marginBottom: 32 }}>
        <Col>
          <Title>ANSI Escape Color Display Tool</Title>
          <Paragraph>
            Paste your text logs with ANSI escape sequences below to see them colorized.
          </Paragraph>
        </Col>
      </Row>
      <Row gutter={32}>
        <Col span={12}>
          <Card
            title={
              <Space>
                Input (ANSI Text)
                <Button icon={<SnippetsOutlined />} size="small" onClick={handlePaste}>
                  Paste
                </Button>
                <Button
                  icon={<UploadOutlined />}
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </Space>
            }
          >
            <TextArea
              rows={12}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Paste ANSI-colored log text here..."
              autoSize={{ minRows: 10, maxRows: 20 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title={
              <Space style={{ width: "100%", justifyContent: "space-between", display: "flex" }}>
                <span>Output (Colorized)</span>
                <Space>
                  Copy/Download as:
                  <Dropdown
                    menu={{
                      items: dropdownItems,
                      onClick: ({ key }) => setOutputType(key as OutputType),
                    }}
                    trigger={["click"]}
                  >
                    <Button size="small">
                      {dropdownItems.find(item => item.key === outputType)?.label}
                      <DownOutlined />
                    </Button>
                  </Dropdown>
                  <Button icon={<CopyOutlined />} size="small" onClick={handleCopy}>
                    Copy
                  </Button>
                  <Button icon={<DownloadOutlined />} size="small" onClick={handleDownload}>
                    Download
                  </Button>
                </Space>
              </Space>
            }
          >
            <AnsiOutput input={input} />
          </Card>
        </Col>
      </Row>
    </Layout>
  );
}
