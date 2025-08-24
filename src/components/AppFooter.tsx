import { Button, Layout, Space } from "antd";
import { SOURCE_URL } from "../constants/socialAddresses";
import { GithubFilled } from "@ant-design/icons";

const { Footer } = Layout;

export default function AppFooter() {
  return (
    <Footer style={{ textAlign: "center", margin: "auto", height: "100%", width: "100%" }}>
      <Space direction="vertical" size="small">
        {/* <Text>© 2023 Your Company. All rights reserved.</Text> */}
        <Button
          type="link"
          href={SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          icon={<GithubFilled />}
        >
          Website Source
        </Button>
      </Space>
    </Footer>
  );
}
