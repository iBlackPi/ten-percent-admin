import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Input, Table, Upload, message } from 'antd';
import type { RcFile } from 'antd/es/upload';
import { CopyOutlined, UploadOutlined } from '@ant-design/icons';
import { api } from '../../api';
import { Card, PageHeader } from '../../components/page-header';
import type { StaticAsset } from '../../models/types.ts';
import { fmtDateTime } from '../../utils/format.ts';
import styles from './index.module.scss';

const fmtSize = (bytes: number): string => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

const copyText = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    message.success('链接已复制');
  } catch {
    message.error('复制失败，请手动选中链接复制');
  }
};

/** 静态资源：前端用到的 Logo、插画、图标。上传后拿链接贴进代码，图片不再跟着项目打包 */
export const StaticAssetsPage = () => {
  const [items, setItems] = useState<StaticAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState('web');
  const [uploading, setUploading] = useState(0);
  const [keyword, setKeyword] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api.staticAssets());
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const upload = async (file: RcFile) => {
    setUploading((n) => n + 1);
    try {
      const asset = await api.uploadStaticAsset(file, folder);
      setItems((list) => [asset, ...list.filter((i) => i.path !== asset.path)]);
      message.success(`${file.name} 上传成功`);
    } catch (e) {
      message.error(`${file.name}：${(e as Error).message}`);
    } finally {
      setUploading((n) => n - 1);
    }
  };

  const shown = useMemo(() => items.filter((i) => i.path.includes(keyword.trim().toLowerCase())), [items, keyword]);

  return (
    <div>
      <PageHeader title="静态资源" desc="PC 端、H5 用到的 Logo、插画、图标等图片。上传后复制链接到代码里使用，图片不再打进安装包。" />
      <Card title="上传图片">
        <Alert
          className={styles.tip}
          type="info"
          showIcon
          message="图片存在 OSS 的静态目录，公开可读，和用户上传的私有图片分开。文件名会自动加上内容哈希，换图会得到新链接，旧链接不受影响，可放心长期缓存。不要上传含个人信息的图片。"
        />
        <div className={styles.row}>
          <span className={styles.label}>存放目录</span>
          <Input className={styles.folder} value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="如 web/home、h5/tabbar，可留空" />
          <Upload accept="image/png,image/jpeg,image/webp,image/gif" multiple showUploadList={false} beforeUpload={(file) => { void upload(file); return false; }}>
            <Button type="primary" icon={<UploadOutlined />} loading={uploading > 0}>选择图片上传（可多选）</Button>
          </Upload>
        </div>
        <p className={styles.hint}>目录最多 3 层，只能用小写字母、数字、-、_。建议按端和页面分，例如 web/home、h5/tabbar。</p>
      </Card>
      <Card title={`已上传（${items.length}）`} extra={<Input.Search className={styles.search} allowClear placeholder="按路径搜索" onChange={(e) => setKeyword(e.target.value)} />}>
        <Table<StaticAsset>
          rowKey="path"
          loading={loading}
          dataSource={shown}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          columns={[
            { title: '预览', dataIndex: 'url', width: 88, render: (url: string) => <img className={styles.thumb} src={url} alt="" loading="lazy" /> },
            { title: '路径', dataIndex: 'path', width: 280, render: (path: string) => <span className={styles.path}>{path}</span> },
            { title: '大小', dataIndex: 'size', width: 90, render: fmtSize },
            { title: '上传时间', dataIndex: 'uploadedAt', width: 150, render: fmtDateTime },
            {
              title: '链接',
              dataIndex: 'url',
              render: (url: string) => (
                <div className={styles.linkCell}>
                  <a className={styles.link} href={url} target="_blank" rel="noreferrer">{url}</a>
                  <Button size="small" icon={<CopyOutlined />} onClick={() => void copyText(url)}>复制</Button>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
