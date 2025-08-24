import { ConfigProvider, Divider, Layout } from "antd";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import NotFoundPage from "./pages/NotFoundPage";
import HomePage from "./pages/HomePage";
import { Content } from "antd/es/layout/layout";
import Footer from "./components/AppFooter";

function App() {
  return (
    <ConfigProvider>
      <BrowserRouter>
        <Layout style={{ minHeight: "100vh", minWidth: "100vw" }}>
          <Content style={{ width: "100%" }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Content>
          <Divider />
          <Footer />
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App
