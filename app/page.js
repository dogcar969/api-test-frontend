"use client";

// TODO 结果回显
// TODO md

import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Input,
  Select,
  Tabs,
  Modal,
  Layout,
  Table,
  Dropdown,
  message,
  Spin,
} from "antd";
const { Content, Sider } = Layout;
const { TextArea } = Input;
import EditableTable from "@/components/editableTable";
const axios = require("axios");
var sha256 = require("js-sha256").sha256;

import { getUser, loginUser, registerUser, renameUser } from "@/apis/user";
import {
  createRequest,
  DeleteRequest,
  RenameRequest,
  updateRequest,
} from "@/apis/request";
import { DeleteFolder, NewFolder, RenameFolder } from "@/apis/folder";

const Home = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const [url, setUrl] = useState("localhost:8080");

  // urlHeader method 选择器
  const [method, setMethod] = useState("GET");
  const [urlHeader, setUrlHeader] = useState("http://");
  const urlHeaders = [
    {
      value: "http://",
    },
    {
      value: "https://",
    },
  ];
  const methods = [
    {
      value: "GET",
    },
    {
      value: "POST",
    },
    {
      value: "PUT",
    },
    {
      value: "DELETE",
    },
    {
      value: "PATCH",
    },
    {
      value: "HEAD",
    },
    {
      value: "CONNECT",
    },
    {
      value: "OPTIONS",
    },
    {
      value: "TRACE",
    },
  ];
  const handleUrlHeaderSelect = (value) => {
    setUrlHeader(value);
  };
  const handleMethodSelect = (value) => {
    setMethod(value);
  };
  // 只有bodyAvailable中的几个方式可以使用body
  const [bodyDisable, setBodyDisable] = useState(false);
  const bodyAvailable = ["POST", "PUT", "DELETE", "PATCH"];
  useEffect(() => {
    if (bodyAvailable.includes(method)) {
      setBodyDisable(false);
    } else {
      setBodyDisable(true);
    }
  }, [method]);

  // 表格传值
  const ArrayToMap = (arr) => {
    var res = {};
    arr.forEach((value) => {
      res[value["_key"]] = value["value"];
    });
    return res;
  };
  const [headers, setHeaders] = useState({});
  const [params, setParams] = useState({});
  const [body, setBody] = useState({});
  const [json, setJson] = useState();
  const handleHeaderReturn = (data) => {
    setHeaders(ArrayToMap(data));
  };
  const handleParamsReturn = (data) => {
    setParams(ArrayToMap(data));
  };
  const handleBodyReturn = (data) => {
    setBody(ArrayToMap(data));
  };
  const handleSend = async () => {
    const data = await axios({
      method,
      url: urlHeader + url,
      headers,
      params,
      body,
    });
    setJsonShow(JSON.stringify(data.data, null, 2));
  };
  const mapToParameter = (map, Type) => {
    const array = Object.entries(map);
    return array.map(([Key, Value]) => {
      return { Type, Key, Value };
    });
  };
  const tableDataToParameters = () => {
    return mapToParameter(body, 2).concat([
      mapToParameter(headers, 0),
      mapToParameter(params, 1),
      [{ Type: 3, Key: "json", Value: json }],
    ]);
  };

  const getlatestRequest = (request) => {
    request.Parameters = tableDataToParameters();
    request.FolderID = requestBelongToFolder.current;
    request.Url = url;
    request.Result = jsonShow;
    request.Method = method;
    request.ProtocolHeader = urlHeader;
  };

  const handleSave = async () => {
    // 1. nowOpenRequest有值，Patch
    // 2. nowOpenRequest没有值，post

    if (nowOpenRequest.current === 0) {
      RenameType.current = "命名";
      setRenameMedalIsOpen(true);
      // 之后的逻辑在saveNewRequest中
    } else {
      let request;
      const oldRequest = FindRequest(nowOpenRequest);
      getlatestRequest(request);
      request.ID = oldRequest.ID;
      await updateRequest(request);
      await dataRefresh();
    }
  };
  const saveNewRequest = async () => {
    let request;
    getlatestRequest(request);
    await createRequest(request);
    await dataRefresh();
  };
  // 结果区域设置
  const [jsonShow, setJsonShow] = useState("");

  // 表格设置
  const paramsColumns = [
    {
      title: "键",
      dataIndex: "_key",
      width: "40%",
      editable: true,
    },
    {
      title: "值",
      dataIndex: "value",
      width: "40%",
      editable: true,
    },
  ];
  const defaultValue = [{ _key: "key", value: "value" }];
  const headerDefaultValue = useRef(defaultValue);
  const paramDefaultValue = useRef(defaultValue);
  const bodyDefaultValue = useRef(defaultValue);
  const bodyItems = [
    {
      key: "1",
      label: "formdata",
      children: (
        <EditableTable
          defaultValue={bodyDefaultValue.current}
          _defaultColumns={paramsColumns}
          defaultAddRow={{ _key: "key", value: "value" }}
          valueReturnFunction={handleBodyReturn}
        ></EditableTable>
      ),
    },
    {
      key: "2",
      label: "json",
      children: (
        <TextArea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          placeholder="请在这里输入json"
          autoSize={{ minRows: 2, maxRows: 6 }}
        />
      ),
    },
  ];
  const TablesItems = [
    {
      key: "1",
      label: "Headers",
      children: (
        <EditableTable
          defaultValue={headerDefaultValue.current}
          _defaultColumns={paramsColumns}
          defaultAddRow={{ _key: "key", value: "value" }}
          valueReturnFunction={handleHeaderReturn}
        ></EditableTable>
      ),
    },
    {
      key: "2",
      label: "Params",
      children: (
        <EditableTable
          defaultValue={paramDefaultValue.current}
          _defaultColumns={paramsColumns}
          defaultAddRow={{ _key: "key", value: "value" }}
          valueReturnFunction={handleParamsReturn}
        ></EditableTable>
      ),
    },
    {
      // 制作formdata表单域和json域两种
      // 制作文件形式？
      key: "3",
      label: "Body",
      children: <Tabs defaultActiveKey="1" items={bodyItems}></Tabs>,
      disabled: bodyDisable,
    },
  ];
  // 左边加一个文件夹区域
  // 表格中加上rowSelection
  const emptyRequest = {
    Method: "GET",
    Name: "",
    ProtocolHeader: "http://",
    Result: "",
    Url: "",
    Parameters: [],
  };
  const openRequest = (request, id) => {
    setMethod(request.Method);
    setUrl(request.Url);
    setUrlHeader(request.ProtocolHeader);
    setJsonShow(request.Result);
    let headersParam = [];
    let queryParam = [];
    let bodyParam = [];
    const params = structuredClone(request.Parameters); // 深拷贝
    params.forEach((param) => {
      param._key = param.Key;
      param.value = param.Value;
      switch (param.Type) {
        case 0:
          headersParam.push(param);
          break;
        case 1:
          queryParam.push(param);
          break;
        case 2:
          bodyParam.push(param);
          break;
        case 3:
          setJson(param.Value);
          break;
        default:
          console.error("请求参数出错");
      }
    });
    headerDefaultValue.current =
      headersParam.length !== 0 ? headersParam : defaultValue;
    paramDefaultValue.current =
      queryParam.length !== 0 ? queryParam : defaultValue;
    bodyDefaultValue.current = bodyParam !== 0 ? bodyParam : defaultValue;
    nowOpenRequest.current = id;
  };

  const [collapsed, setCollapsed] = useState(false);
  const sideBarTitle = "";
  const folderDropDownItems = [
    {
      key: "1",
      label: "新建请求",
    },
    {
      key: "2",
      label: "导入请求",
    },

    {
      key: "3",
      label: "修改名字",
    },
    {
      key: "4",
      label: "删除文件夹",
    },
  ];
  const clipboard = navigator.clipboard;
  const requestBelongToFolder = useRef(0); // 如果是新建的请求，可以根据这个知道属于哪个文件夹
  const handleNewRequest = () => {
    openRequest(emptyRequest, 0);
    requestBelongToFolder(selectedFolder.current);
    nowOpenRequest.current = 0;
  };
  const importRequestTransform = (req) => {
    // req struct: Method,Name,Parameters,ProtocolHeader,Result,Url
    // add field: FolderID UserID
    // return newReq,isReq

    // check struct
    const keys = ["Method", "Name", "ProtocolHeader", "Result", "Url"];
    if (
      keys.every(
        (item) => req.hasOwnProperty(item) && typeof req[item] == "string"
      ) &&
      req.hasOwnProperty("Parameters") &&
      req.Parameters instanceof Array
    ) {
      // add field
      req.FolderID = selectedFolder.current;
      req.UserID = userInfo.ID;
      return [req, true];
    }
    return [{}, false];
  };
  const handleImportRequest = async () => {
    const text = await clipboard.readText();
    const request = JSON.parse(text);
    // requests = [req1,req2 ...]
    if (Array.isArray(request)) {
      for (let i = 0; i < request.length; i++) {
        const [newReq, ok] = importRequestTransform(request[i]);
        if (!ok) {
          messageApi.error("导入格式错误");
        }
        request[i] = newReq;
      }
      messageApi.open({
        key: "import",
        type: "loading",
        content: <>正在导入请求，请耐心等待</>,
      });
      let completedImportNum = 0;
      for (const req of request) {
        createRequest(req)
          .then(() => {
            completedImportNum += 1;
            messageApi.open({
              key: "import",
              type: "loading",
              content: (
                <>
                  <Spin />
                  正在导入请求，已导入{completedImportNum}个请求
                </>
              ),
            });
            if (completedImportNum === request.length) {
              messageApi.open({
                key: "import",
                type: "loading",
                content: (
                  <>
                    <Spin />
                    已导入完成
                  </>
                ),
              });
            }
          })
          .catch((err) => {
            messageApi.open({
              key: "import",
              type: "success",
              content: <>导入失败，{err}</>,
            });
            return;
          });
      }
      dataRefresh();
    }
    // request
    else {
      const [newReq, ok] = importRequestTransform(request);
      if (ok) {
        messageApi.open({
          key: "import",
          type: "loading",
          content: (
            <>
              <Spin />
              正在导入请求，请耐心等待
            </>
          ),
        });
        createRequest(newReq)
          .then(() => {
            messageApi.open({
              key: "import",
              type: "success",
              content: "已导入完成",
            });
          })
          .catch((err) => {
            messageApi.open({
              key: "import",
              type: "success",
              content: <>导入失败，{err}</>,
            });
          });
        dataRefresh();
      } else {
        messageApi.error("导入格式错误");
      }
    }
  };
  // handleRenameFolder由于重用对话框在重命名部分

  const handleDeleteFolder = async () => {
    await DeleteFolder(selectedFolder.current);
    await dataRefresh();
    // .then(() => {
    //   message.success("删除成功");
    // })
    // .catch((err) => message.error(err));
  };

  const folderOnClick = ({ key }) => {
    switch (key) {
      case "1":
        handleNewRequest();
        break;
      case "2":
        handleImportRequest();
        break;
      case "3":
        handleRenameFolder();
        break;
      case "4":
        handleDeleteFolder();
        break;
    }
  };

  const nowOpenRequest = useRef(0);
  const requestDropDownActions = [
    {
      key: "1",
      label: "打开",
    },
    {
      key: "2",
      label: "重命名",
    },
    {
      key: "3",
      label: "删除",
    },
    {
      key: "4",
      label: "新建备份",
    },
    {
      key: "5",
      label: "分享请求",
    },
  ];
  const FindRequest = (id) => {
    let res = {};
    folderData.forEach((folder) => {
      const result = folder.Requests.find((request) => request.ID === id);
      if (result !== undefined) {
        res = result;
      }
    });
    return res;
  };
  const FindFolder = (id) => {
    return folderData.find((item) => item.ID === id);
  };

  const handleOpenRequest = () => {
    const request = FindRequest(selectedRequest.current);
    // 将数据放到界面上
    openRequest(request, selectedRequest.current);
  };

  // handleRenameRequest 由于共用对话框在重命名部分
  const handleDeleteRequest = async () => {
    await DeleteRequest(selectedRequest.current);
    await dataRefresh();
  };
  const handleBackupRequest = async () => {
    const request = FindRequest(selectedRequest.current);
    const ID = request.ID;
    delete request.ID;
    await createRequest(request);
    request.ID = ID;
    await dataRefresh();
  };
  const handleShareRequest = () => {
    let request = structuredClone(FindRequest(selectedRequest.current));
    delete request.FolderID;
    delete request.UserID;
    delete request.ID;
    clipboard.writeText(JSON.stringify(request));
    message.success("请求信息已复制到剪切板");
  };
  const requestOnClick = ({ key }) => {
    switch (key) {
      case "1":
        handleOpenRequest();
        break;
      case "2":
        handleRenameRequest();
        break;
      case "3":
        handleDeleteRequest();
        break;
      case "4":
        handleBackupRequest();
        break;
      case "5":
        handleShareRequest();
        break;
      default:
        console.error("dropdown值不对");
    }
  };
  const selectedFolder = useRef(0);
  const selectedRequest = useRef(0);

  const folderExpand = (folder) => {
    return folder.Requests === null ? (
      <div>无请求</div>
    ) : (
      folder.Requests.map((value) => {
        return (
          <Dropdown
            menu={{ items: requestDropDownActions, onClick: requestOnClick }}
            key={folder.ID}
            trigger={["click"]}
          >
            <div
              onClick={() => {
                selectedRequest.current = value.ID;
              }}
            >
              {value.Name}
            </div>
          </Dropdown>
        );
      })
    );
  };
  const handleNewFolder = async () => {
    await NewFolder("New folder");
    await dataRefresh();
  };
  const folderColumns = [
    {
      title: (
        <>
          <div className="flex gap-2">
            <span>请求</span>{" "}
            <Button size="small" onClick={() => handleNewFolder()}>
              新文件夹
            </Button>
          </div>
        </>
      ),
      dataIndex: "Name",
      key: "ID",
      render: (text, value) => {
        return (
          <Dropdown
            menu={{ items: folderDropDownItems, onClick: folderOnClick }}
            trigger={["click"]}
          >
            <div
              onClick={() => {
                selectedFolder.current = value.ID;
              }}
            >
              {text}
            </div>
          </Dropdown>
        );
      },
    },
  ];
  const [folderData, setFolderData] = useState([]);
  const dataRefresh = async () => {
    if (isLogin) {
      const res = await getUser();
      setFolderData(folderModify(res));
      setUserInfo(res);
    } else {
      setFolderData([]);
      setUserInfo({});
    }
  };
  // 登录
  const [isLogin, setIsLogin] = useState(false);
  const [userId, setUserId] = useState("");
  const [userInfo, setUserInfo] = useState("");
  const folderModify = (res) => {
    // 给每个folder添加key
    res.Folders.forEach((item) => {
      item.key = item.ID;
    });
    return res.Folders;
  };
  const userChange = async () => {
    const token = localStorage.getItem("token");
    if (token === null || token === "") {
      return;
    }
    const res = await getUser();
    if (res instanceof axios.AxiosError) {
      setIsLogin(false);
      localStorage.setItem("token", "");
      return;
    }
    setFolderData(folderModify(res));
    setUserInfo(res);
    setIsLogin(true);
  };
  useEffect(() => {
    userChange();
  }, [userId]);
  // 登录对话框
  const [LoginMedalIsOpen, SetLoginMedalIsOpen] = useState(false);
  const [LoginLoading, SetLoginLoading] = useState(false);
  const LoginMedalOpen = () => {
    SetLoginMedalIsOpen(true);
  };
  const LoginMedalClose = () => {
    SetLoginMedalIsOpen(false);
  };
  const handleLogin = async () => {
    SetLoginLoading(true);
    // const encryptedPassword = sha256.update(LoginPassword);
    // await userLogin(LoginAccount, encryptedPassword);
    const res = await loginUser(LoginAccount, LoginPassword);
    localStorage.setItem("token", res.token);
    setUserId(LoginAccount);
    SetLoginLoading(false);
    SetLoginMedalIsOpen(false);
    setIsLogin(true);
  };

  const [LoginAccount, SetLoginAccount] = useState("");
  const [LoginPassword, SetLoginPassword] = useState("");
  // 注册对话框
  const [RegisterMedalIsOpen, SetRegisterMedalIsOpen] = useState(false);
  const RegisterMedalOpen = () => {
    SetRegisterMedalIsOpen(true);
  };
  const RegisterMedalClose = () => {
    SetRegisterMedalIsOpen(false);
  };

  const [RegisterAccount, SetRegisterAccount] = useState("");
  const [RegisterPassword, SetRegisterPassword] = useState("");
  const [ConfirmRegisterPassword, SetConfirmRegisterPassword] = useState("");
  const handleRegister = () => {
    registerUser(RegisterAccount, RegisterPassword, ConfirmRegisterPassword);
  };
  // 退出
  const handleQuit = () => {
    setUserInfo({});
    setFolderData([]);
    localStorage.setItem("token", "");
    setUserId("");
    setIsLogin(false);
  };
  // 更名
  const handleRenameUser = () => {
    RenameType.current = "用户";
    oldName.current = userInfo.Name;
    setRenameMedalIsOpen(true);
  };
  const handleRenameFolder = () => {
    RenameType.current = "文件夹";
    oldName.current = FindFolder(selectedFolder.current).Name;
    setRenameMedalIsOpen(true);
  };
  const handleRenameRequest = () => {
    RenameType.current = "请求";
    oldName.current = FindRequest(selectedRequest.current).Name;
    setRenameMedalIsOpen(true);
  };

  const [newName, setNewName] = useState("");
  const oldName = useRef("");
  const RenameId = useRef("");
  const [RenameMedalIsOpen, setRenameMedalIsOpen] = useState();
  const RenameType = useRef("请求"); // request:请求 folder：文件夹 user：用户
  const RenameMedalClose = () => {
    setRenameMedalIsOpen(false);
  };
  const handleRename = async () => {
    switch (RenameType.current) {
      case "请求":
        await RenameRequest(RenameId, newName);
        await dataRefresh();
        break;
      case "文件夹":
        await RenameFolder(RenameId, newName);
        await dataRefresh();
        break;
      case "用户":
        await renameUser(newName);
        await dataRefresh();
        break;
      case "命名":
        await saveNewRequest();
        await dataRefresh();
        break;
      default:
        console.error("重命名类型错误");
    }
  };
  return (
    <>
      {contextHolder}
      <div className="flex">
        {/*左侧 */}
        <Layout>
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
          >
            <div
              className="h-screen"
              style={{
                backgroundColor: "#fafafa",
                border: "1px solid rgba(5, 5, 5, 0.06)",
              }}
            >
              <div className="flex justify-between mx-4 mt-2">
                <div className="flex-grow text-center  my-auto">
                  {sideBarTitle}
                </div>
              </div>
              {/*文件夹区域 */}
              <div>
                <Table
                  columns={folderColumns}
                  dataSource={folderData}
                  expandable={{
                    expandedRowRender: (folder) => folderExpand(folder),
                  }}
                ></Table>
              </div>
            </div>
          </Sider>
          <Content>
            <div className="mx-10 flex-grow">
              <div className="flex justify-end mr-10 my-4 gap-4">
                {isLogin ? (
                  <>
                    <span>{userInfo.Name}</span>
                    <Button onClick={() => handleRenameUser()}>更名</Button>
                    <Button onClick={handleQuit}>注销</Button>
                  </>
                ) : (
                  <>
                    <Button onClick={LoginMedalOpen}>登录</Button>
                    <Button onClick={RegisterMedalOpen}>注册</Button>
                  </>
                )}
              </div>
              <div>
                {/*元数据区域 */}

                <h1 className="text-center text-4xl my-4">接口实际环境测试</h1>
                <div className="flex gap-2 mt-2">
                  <Select
                    style={{ width: 120 }}
                    defaultValue="GET"
                    onChange={handleMethodSelect}
                    options={methods}
                  ></Select>
                  <Select
                    defaultValue="http://"
                    onChange={handleUrlHeaderSelect}
                    options={urlHeaders}
                  ></Select>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  ></Input>
                  <Button type="primary" onClick={handleSend}>
                    发送
                  </Button>
                  <Button type="" onClick={() => handleSave()}>
                    保存
                  </Button>
                </div>
              </div>
              {/*参数区域 */}

              <div>
                <Tabs defaultActiveKey="1" items={TablesItems} />
              </div>
              {/*结果区域 */}

              <div>
                <p> 结果：</p>
                <div className="whitespace-pre-wrap">{jsonShow}</div>
              </div>
            </div>
          </Content>
        </Layout>
      </div>
      {/* 对话框 */}

      <div>
        {/* 登录对话框 */}

        <Modal
          open={LoginMedalIsOpen}
          title="登 录"
          onCancel={LoginMedalClose}
          footer={[
            <Button key="back" onClick={LoginMedalClose}>
              取消
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={LoginLoading}
              onClick={handleLogin}
            >
              确认
            </Button>,
          ]}
        >
          <div className="m-10 flex flex-col gap-4">
            <div className="flex">
              <div className="my-auto w-12">账号</div>
              <Input
                value={LoginAccount}
                onChange={(e) => SetLoginAccount(e.target.value)}
                className="flex-grow"
              ></Input>
            </div>
            <div className="flex">
              <div className="my-auto w-12">密码</div>
              <Input.Password
                value={LoginPassword}
                onChange={(e) => SetLoginPassword(e.target.value)}
                className="flex-grow"
              ></Input.Password>
            </div>
          </div>
        </Modal>
        {/* 注册对话框 */}

        <Modal
          open={RegisterMedalIsOpen}
          title="注册"
          onCancel={RegisterMedalClose}
          footer={[
            <Button key="back" onClick={RegisterMedalClose}>
              取消
            </Button>,
            <Button key="submit" type="primary" onClick={handleRegister}>
              确认
            </Button>,
          ]}
        >
          <div className="m-10 flex flex-col gap-4">
            <div className="flex">
              <div className="my-auto w-20">账号</div>
              <Input
                className="flex-grow"
                value={RegisterAccount}
                onChange={(e) => SetRegisterAccount(e.target.value)}
              ></Input>
            </div>
            <div className="flex">
              <div className="my-auto w-20">密码</div>
              <Input.Password
                className="flex-grow"
                value={RegisterPassword}
                onChange={(e) => SetRegisterPassword(e.target.value)}
              ></Input.Password>
            </div>
            <div className="flex">
              <div className="my-auto w-20">确认密码</div>
              <Input.Password
                value={ConfirmRegisterPassword}
                onChange={(e) => SetConfirmRegisterPassword(e.target.value)}
              ></Input.Password>
            </div>
          </div>
        </Modal>
        <Modal
          open={RenameMedalIsOpen}
          title={
            RenameType.current === "命名"
              ? "命名新请求"
              : "修改" + RenameType.current + " : " + oldName.current
          }
          onCancel={RenameMedalClose}
          footer={[
            <Button key="back" onClick={RenameMedalClose}>
              取消
            </Button>,
            <Button key="submit" type="primary" onClick={handleRename}>
              确认
            </Button>,
          ]}
        >
          <div className="m-10 flex flex-col gap-4">
            <div className="flex">
              <div className="my-auto w-20">新名称</div>
              <Input
                className="flex-grow"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              ></Input>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default Home;
