import Head from 'next/head';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const teste = post.data.content[0].body.map(x => { return x.text }).reduce((acc, value) => acc += value).split(' ').length;
  const teste2 = post.data.content[1].body.map(x => { return x.text }).reduce((acc, value) => acc += value).split(' ').length;

  let totalString = ((teste + teste2) / 200).toString().replace(/\D/g, "");
  const totalString2 = ((teste + teste2) / 200).toString().replace(/\D/g, "").slice(1, 2);

  var totalInt = parseInt(totalString)
  const totalIntCut = parseInt(totalString2)

  const timeF = () => {
    (totalIntCut > 5) ? totalInt = (totalInt / 1000) + 1 : totalInt;
    return totalInt.toString().replace(/\D/g, "").slice(0, 1);
  }

  const time = timeF()

  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>{`${post.data.title} | spacetraveling`}</title>
      </Head>

      <img className={styles.banner} src={post.data.banner.url} alt="banner" />

      <article className={styles.container}>
        <strong className={styles.title}>{post.data.title}</strong>

        <div className={styles.postInfo}>
          <div>
            <FiCalendar size={20} />
            <time>
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>
          </div>
          <div>
            <FiUser size={20} />
            <p>{post.data.author}</p>
          </div>
          <div>
            <FiClock size={20} />
            <p>{time} min</p>
          </div>
        </div>
        <section className={styles.content}>
          {post.data.content.map(({ heading, body }, index) => (
            <div key={String(index)}>
              <h2>{heading}</h2>
              <div
                className={styles.boxContent}
                dangerouslySetInnerHTML={{ __html: RichText.asHtml(body) }}
              />
            </div>
          ))}
        </section>
      </article>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.predicates.at('document.type', 'posts')
  );
  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const { title, author, banner, content, subtitle } = response.data;

  const Title = Array.isArray(title) ? RichText.asText(title) : title;

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: Title,
      banner: { url: banner.url },
      author,
      content: content.map(({ heading, body }) => {
        return {
          heading,
          body,
        };
      }),
      subtitle,
    },
  };
  console.log(post);

  return {
    props: { post },
    revalidate: 60 * 60, // 1 hora
  };
};
