/* eslint-disable */
/* @ts-nocheck */
/* JAF-ignore */
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Layout, 
  Typography, 
  Space,
  Tabs,
  Empty,
  Spin,
  message,
  Row,
  Col,
  Card,
  Avatar,
  Button,
  Pagination
} from 'antd';
import { 
  FileTextOutlined, 
  UserOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { articleApi } from '../api/articleApi';
import { userApi } from '../api/userApi';
import { searchApi } from '../api/searchApi';
import ArticleList from '../components/ArticleList';
import { Link } from 'react-router-dom';
import useTranslation from '../hooks/useTranslation';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('articles');
  const [searchType, setSearchType] = useState('general'); // 'general', 'authors', 'articles'
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (query) {
      analyzeQueryAndSearch();
    }
  }, [query]);

  // Debug: Monitor articles state changes
  useEffect(() => {
    console.log('🔄 Articles state changed:', articles.length, 'articles');
    console.log('🔄 Articles data:', articles);
  }, [articles]);

  // Debug: Monitor users state changes
  useEffect(() => {
    console.log('🔄 Users state changed:', users.length, 'users');
  }, [users]);

  // Force re-render when search completes
  const [searchCompleted, setSearchCompleted] = useState(false);

  const analyzeQueryAndSearch = async (page = 1) => {
    setLoading(true);
    if (page === 1) {
      setArticles([]); // Clear previous results only on first page
      setUsers([]);    // Clear previous results only on first page
    }
    
    try {
      console.log('🔍 Starting AI-powered search analysis for query:', query, 'page:', page);
      
      // Use backend AI classification instead of frontend detection
      const response = await searchApi.search(query, pagination.pageSize, page, 60);
      console.log('🔍 AI search response:', response);
      
      // Handle the response based on what the backend AI classified and returned
      if (response.success || response.articles || response.users) {
        // Handle new format with both articles and users
        const articlesData = response.articles || [];
        const usersData = response.users || [];
        const articlePagination = response.articlePagination || {};
        const authorPagination = response.authorPagination || {};
        
        console.log('🔍 Articles found:', articlesData.length, 'items');
        console.log('🔍 Users found:', usersData.length, 'items');
        console.log('📄 Article pagination:', articlePagination);
        console.log('📄 Author pagination:', authorPagination);
        
        // Set both articles and users data
        console.log('🔍 Setting articles data:', articlesData, 'Type:', typeof articlesData, 'IsArray:', Array.isArray(articlesData));
        console.log('🔍 Setting users data:', usersData, 'Type:', typeof usersData, 'IsArray:', Array.isArray(usersData));
        setArticles(Array.isArray(articlesData) ? articlesData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
        
        // Determine which tab to show based on results
        if (articlesData.length > 0 && usersData.length > 0) {
          // Both have results, default to articles tab
          setActiveTab('articles');
          setSearchType('general');
          // Use article pagination for the initial view
          setPagination({
            current: articlePagination.page || page,
            pageSize: articlePagination.page_size || pagination.pageSize,
            total: articlePagination.total_results || articlesData.length,
            totalPages: articlePagination.total || 1
          });
        } else if (usersData.length > 0) {
          // Only users have results
          setActiveTab('users');
          setSearchType('authors');
          // Use author pagination
          setPagination({
            current: authorPagination.page || page,
            pageSize: authorPagination.page_size || pagination.pageSize,
            total: authorPagination.total_results || usersData.length,
            totalPages: authorPagination.total || 1
          });
        } else if (articlesData.length > 0) {
          // Only articles have results
          setActiveTab('articles');
          setSearchType('articles');
          // Use article pagination
          setPagination({
            current: articlePagination.page || page,
            pageSize: articlePagination.page_size || pagination.pageSize,
            total: articlePagination.total_results || articlesData.length,
            totalPages: articlePagination.total || 1
          });
        } else {
          // No results, default to articles tab
          setActiveTab('articles');
          setSearchType('general');
          setPagination({
            current: page,
            pageSize: pagination.pageSize,
            total: 0,
            totalPages: 1
          });
        }

      } else {
        console.log('❌ No results or unsuccessful search');
        message.info('No results found for your query');
      }
      
      console.log('✅ AI search analysis completed');
      setSearchCompleted(true); // Mark search as completed
    } catch (error) {
      console.error('❌ Search error:', error);
      message.error('An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page, contentType = 'articles') => {
    console.log('🔄 Page changed:', page, 'contentType:', contentType);
    setPagination(prev => ({ ...prev, current: page }));
    // Trigger new search with the updated page
    analyzeQueryAndSearch(page);
    
    // Switch to the appropriate tab if needed
    if (contentType === 'users' && activeTab !== 'users') {
      setActiveTab('users');
    } else if (contentType === 'articles' && activeTab !== 'articles') {
      setActiveTab('articles');
    }
  };

  const searchArticles = async () => {
    try {
      console.log('🔍 Starting articles search for query:', query);
      
      // Wait for the API call to complete
      // Request server-side page 1 with page_size=12 (backend expects page_index 0-based)
      const response = await articleApi.searchArticles(query, 12, 1, 60);
      console.log('🔍 Articles search response:', response);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response keys:', Object.keys(response || {}));
      
      // Backend returns results in "results" property, not "data"
      const articlesData = response.results || response.data || [];
      console.log('📚 Articles data to display:', articlesData);
      console.log('📚 Articles count:', articlesData.length);
      console.log('📚 First article sample:', articlesData[0]);
      
      // Set articles state
      setArticles(articlesData);
      
      // Wait for state to be updated
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('✅ Articles state updated, current count:', articlesData.length);
      
      // Return the data to ensure it's processed
      return articlesData;
    } catch (error) {
      console.error('Search articles error:', error);
      setArticles([]);
      return [];
    }
  };

  const searchUsersAI = async () => {
    try {
      console.log('🔍 Starting users AI search for query:', query);
      
      // Try AI-powered search first
      // Request authors with page_size=12
      const response = await userApi.searchUsersAI({
        q: query,
        page: 1,
        limit: 12
      });
      
      console.log('🔍 Users search response:', response);
      // Backend returns results in "results" property, not "data"
      let usersData = [];
      
      if (response.success && response.results && response.results.length > 0) {
        console.log('👥 Users data (with success):', response.results);
        usersData = response.results;
      } else if (response.results && response.results.length > 0) {
        // Direct results without success flag
        console.log('👥 Users data (direct):', response.results);
        usersData = response.results;
      } else {
        usersData = [];
      }
      
      // Set users state
      setUsers(usersData);
      
      // Wait for state to be updated
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('✅ Users state updated, current count:', usersData.length);
      
      return usersData;
    } catch (error) {
      console.error('Search users error:', error);
      setUsers([]);
      return [];
    }
  };

  // Removed simple user search to adhere to allowed endpoints only

  const renderUserCard = (user) => (
    <Card key={user.id || user._id} style={{ marginBottom: 16 }}>
      <Row align="middle" gutter={16}>
        <Col>
          <Avatar size={64} src={user.avatar_url || user.avatar}>
            {user.full_name?.[0] || user.name?.[0] || 'U'}
          </Avatar>
        </Col>
        <Col flex="auto">
          <Space direction="vertical" size="small">
            <Title level={4} style={{ margin: 0 }}>
              <Link to={`/profile/${user.id || user._id}`}>
                {user.full_name || user.name || 'Unknown User'}
              </Link>
            </Title>
            <Text type="secondary">{user.email || 'No email provided'}</Text>
            {user.bio && (
              <Text>{user.bio}</Text>
            )}
            {user.score && (
              <Text type="secondary">{t('search.score')}: {user.score.toFixed(2)}</Text>
            )}
            {user.search_source && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {t('search.source')}: {user.search_source === 'ai_search' ? t('search.aiSearch') : t('search.aiSearchDatabase')}
              </Text>
            )}
          </Space>
        </Col>
        <Col>
          <Button type="primary">
            <Link to={`/profile/${user.id || user._id}`}>
              {t('search.viewProfile')}
            </Link>
          </Button>
        </Col>
      </Row>
    </Card>
  );

  if (!query) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '0' }}>
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-12 pb-8">
            <SearchOutlined style={{ fontSize: 64, color: '#ccc', marginBottom: 16 }} />
            <Title level={3}>{t('search.title')}</Title>
            <Text type="secondary">
              {t('search.placeholder')}
            </Text>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '0' }}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div style={{ marginBottom: 24 }}>
            {/* <Title level={2}>
              Search results for "{query}"
            </Title> */}
            {searchType === 'authors' && (
              <Text type="secondary" style={{ fontSize: 16 }}>
                {t('search.aiPoweredAuthorSearch')}
              </Text>
            )}
          </div>

          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={[
              {
                key: 'articles',
                label: (
                  <span>
                    <FileTextOutlined />
                    {t('search.articles')}
                  </span>
                ),
                children: (
                  <div>
                    {loading ? (
                      <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Spin size="large" />
                      </div>
                    ) : searchType === 'authors' ? (
                      // Don't show articles for author-specific searches
                      <Empty 
                        description={t('search.switchToUsersTab')}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    ) : (
                      <div>
                        {/* Pass already-fetched articles to prevent duplicate API calls */}
                        <ArticleList 
                          articles={Array.isArray(articles) ? articles : []}
                          loading={loading}
                          showLoadMore={false}
                          searchQuery=""
                        />
                        {Array.isArray(articles) && articles.length > 0 && (
                          <div style={{ textAlign: 'center', marginTop: 24 }}>
                            <Pagination
                              current={pagination.current}
                              pageSize={pagination.pageSize}
                              total={pagination.total}
                              onChange={(page) => handlePageChange(page, 'articles')}
                              showSizeChanger={false}
                              showQuickJumper={true}
                              showTotal={(total, range) => 
                                `${range[0]}-${range[1]} of ${total} articles`
                              }
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              },
              {
                key: 'users',
                label: (
                  <span>
                    <UserOutlined />
                    {t('search.users')} ({Array.isArray(users) ? users.length : 0})
                  </span>
                ),
                children: (
                  <div>
                    {loading ? (
                      <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Spin size="large" />
                      </div>
                    ) : Array.isArray(users) && users.length > 0 ? (
                      <div>
                        {users.map(renderUserCard)}
                        <div style={{ textAlign: 'center', marginTop: 24 }}>
                          <Pagination
                            current={pagination.current}
                            pageSize={pagination.pageSize}
                            total={pagination.total}
                            onChange={(page) => handlePageChange(page, 'users')}
                            showSizeChanger={false}
                            showQuickJumper={true}
                            showTotal={(total, range) => 
                              `${range[0]}-${range[1]} of ${total} users`
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <Empty 
                        description={
                          <div>
                            <div style={{ marginBottom: 16 }}>
                              {searchType === 'authors' 
                                ? t('search.noAuthorsFound')
                                : t('search.noUsersFound')
                              }
                            </div>
                            <div style={{ fontSize: '14px', color: '#666' }}>
                              {t('search.minimalContentSuggestion')}
                            </div>
                            <div style={{ marginTop: 12 }}>
                              <Button type="primary" size="small" onClick={() => setActiveTab('articles')}>
                                {t('search.browseArticles')}
                              </Button>
                            </div>
                          </div>
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </div>
                )
              }
            ]}
          />
        </div>
      </Content>
    </Layout>
  );
};

export default Search;
