import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, message } from 'antd';
import MainLayout from '../components/layout/MainLayout';
import SearchBar from '../components/common/SearchBar';
import { searchMistakes } from '../api/mistake';
import type { PageResponse } from '../types';
import type { Mistake } from '../types';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<Mistake[]>([]);
  const [total, setTotal] = useState(0);

  const handleSearch = async (keyword: string) => {
    try {
      const res = await searchMistakes(keyword, 1, 20);
      const data = res.data as PageResponse<Mistake>;
      setResults(data.content);
      setTotal(data.totalElements);
    } catch {
      message.error('搜索失败');
    }
  };

  return (
    <MainLayout>
      <div style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 16 }}>搜索错题</h2>
        <SearchBar onSearch={handleSearch} />

        <div style={{ marginTop: 24 }}>
          <p style={{ color: '#999' }}>
            搜索到 <strong>{total}</strong> 条结果
          </p>
          {results.map((m) => (
            <Card
              key={m.id}
              hoverable
              style={{ marginBottom: 12 }}
              onClick={() => navigate(`/mistakes/${m.id}`)}
            >
              <Card.Meta
                title={m.title || '（无标题）'}
                description={
                  <div>
                    {m.content?.slice(0, 100)}...
                    <br />
                    <span style={{ color: '#999' }}>
                      {new Date(m.createTime).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                }
              />
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default SearchPage;
