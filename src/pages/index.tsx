import { GetStaticProps } from 'next';
import Head from 'next/head';
import { IconContext } from 'react-icons';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
    updatedAt: string;
  };
}
interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async function handleLoadMorePosts() {
    if (nextPage === null) {
      return;
    }

    const response = await fetch(nextPage);
    const postsResult = await response.json();

    const newPosts = postsResult.results.map(post => ({
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }));

    setNextPage(postsResult.next_page);
    setPosts([...posts, ...newPosts]);
  }



  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  return (
    <>
      <IconContext.Provider value={{ size: '20px' }}>
        <Head>
          <title>Posts | SpaceTravelling</title>
        </Head>

        <main className={styles.container}>
          <div className={styles.posts}>
            {posts.map(post => (
              <Link href={`/posts/${post.uid}`}>
                <a key={post.uid}>
                  <strong>{post.data.title}</strong>
                  <p>{post.data.subtitle}</p>
                  <time>
                    <FiCalendar />
                    &nbsp;{new Date(post.first_publication_date).toLocaleDateString('pt-br', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </time>
                  <small>
                    <FiUser />
                    &nbsp;{post.data.author}
                  </small>
                </a>
              </Link>
            ))}
            {nextPage && (
              <button onClick={handleLoadMorePosts} type="button">
                Carregar mais posts
              </button>
            )}
          </div>
        </main>
      </IconContext.Provider>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author', 'post.updatedAt'],
      pageSize: 2,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });
  console.log(postsResponse.results);

  return {
    props: {
      postsPagination: { next_page: postsResponse.next_page, results: posts },
    },
  };
};