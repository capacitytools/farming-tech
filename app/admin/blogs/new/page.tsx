import BlogEditor from '@/components/admin/BlogEditor';

export default function NewBlogPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-forest-900 dark:text-white mb-6">
        Write New Post
      </h1>
      <BlogEditor />
    </div>
  );
}
