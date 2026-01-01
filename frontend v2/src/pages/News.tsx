import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, FileText, Bell } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: 'announcement' | 'news' | 'guide' | 'update';
  author: string;
}

const newsItems: NewsItem[] = [
  {
    id: '1',
    title: 'New Digital Credential System Launched',
    excerpt:
      'The Government of Kenya through the Ministry of Education has officially launched the CertChain blockchain-based credential verification system.',
    date: '2025-01-15',
    category: 'announcement',
    author: 'Ministry of Education, Kenya',
  },
  {
    id: '2',
    title: 'How to Apply for Certificate Verification',
    excerpt:
      'Step-by-step guide for students on how to request and receive blockchain-verified certificates through the new system.',
    date: '2025-01-10',
    category: 'guide',
    author: 'CertChain Technical Team',
  },
  {
    id: '3',
    title: 'Universities Integration Update',
    excerpt:
      'Over 25 Kenyan universities have successfully integrated with the CertChain system, ensuring seamless certificate issuance.',
    date: '2025-01-05',
    category: 'update',
    author: 'CertChain Partnerships Team',
  },
  {
    id: '4',
    title: 'Employer Verification Portal Now Live',
    excerpt:
      'Employers can now verify academic credentials in real-time through our secure blockchain verification portal.',
    date: '2025-01-03',
    category: 'news',
    author: 'CertChain Product Team',
  },
];

const News = () => {
  const getCategoryColor = (category: NewsItem['category']) => {
    switch (category) {
      case 'announcement':
        return 'bg-red-600 text-white';
      case 'news':
        return 'bg-primary text-white';
      case 'guide':
        return 'bg-accent text-white';
      case 'update':
        return 'bg-green-600 text-white';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getCategoryIcon = (category: NewsItem['category']) => {
    switch (category) {
      case 'announcement':
        return <Bell className="h-3 w-3" />;
      case 'guide':
        return <FileText className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <main className="container mx-auto px-4 py-20">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter mb-3">
              News <span className="text-primary">& Updates</span>
            </h1>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsItems.map((item) => (
            <Link
              key={item.id}
              to={`/article/${item.id}`}
              className="glass p-6 rounded-lg border-2 border-white/5 hover:border-primary/40 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getCategoryColor(
                    item.category
                  )}`}
                >
                  {getCategoryIcon(item.category)}
                  {item.category}
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <time dateTime={item.date}>
                    {new Date(item.date).toLocaleDateString('en-KE', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                </div>
              </div>

              <h2 className="text-lg font-black mb-2 leading-tight group-hover:text-primary transition-colors">
                {item.title}
              </h2>

              <p className="text-sm font-bold text-muted-foreground leading-relaxed mb-4">
                {item.excerpt}
              </p>

              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary group-hover:gap-3 transition-all">
                Read More
                <ArrowRight className="h-3 w-3" />
              </div>

              <div className="mt-4 text-xs font-bold text-muted-foreground">By {item.author}</div>
            </Link>
          ))}
        </div>
    </main>
  );
};

export default News;
