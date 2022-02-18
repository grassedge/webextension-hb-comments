import axios from "axios";
import { format } from "date-fns";
import * as React from "react";

const styles = {
  list: {
    backgroundColor: "#f6f7f8",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: 0,
    margin: 0,
    listStyle: "none",
  },
  itemouter: {
    backgroundColor: "white",
  },
  iteminner: {
    display: "flex",
  },
  left: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "48px",
    padding: "0 8px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  usericon: {
    borderRadius: "4px",
    width: "32px",
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "32px",
  },
  barToChild: {
    flexGrow: 1,
    backgroundColor: "rgb(207, 217, 222)",
    width: "2px",
  },
  spaceToParent: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "8px",
  },
  barToParent: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "8px",
    backgroundColor: "rgb(207, 217, 222)",
    width: "2px",
  },
  right: {
    padding: "8px 0",
  },
  username: {
    color: "#009ad0",
    textDecoration: "none",
    fontSize: "13.5px",
  },
  timestamp: {
    color: "rgba(70,82,94,.8)",
    fontSize: "13.5px",
  },
  comment: {
    fontSize: "13.5px",
    color: "#25282b",
    margin: 0,
    wordBreak: "break-word",
    paddingRight: "8px",
  },
  replyto: {
    color: "#55606a",
  },
  iconList: {
    padding: "16px",
    margin: 0,
    listStyle: "none",
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "8px",
  },
  iconItem: {
    width: "32px",
    height: "32px",
  },
};

const iconUrl = (userId: string) =>
  `https://cdn.profile-image.st-hatena.com/users/${userId}/profile.png`;

const timestampLabel = (nowDate: Date, timestampDate: Date) => {
  const now = nowDate.getTime();
  const timestamp = timestampDate.getTime();
  const diff = Math.floor((now - timestamp) / 1000);
  if (diff < 60) {
    return `${diff}s`;
  }
  if (diff < 3600) {
    return `${Math.floor(diff / 60)}m`;
  }
  if (diff < 3600 * 24) {
    return `${Math.floor(diff / 3600)}h`;
  }
  return `${timestampDate.getFullYear()}/${
    timestampDate.getMonth() + 1
  }/${timestampDate.getDate()}`;
};
type B = {
  timestamp: { label: string; date: Date };
  comment: JSX.Element[] | null;
  replyto: string | null;
  children: B[];
  user: string;
};
type APIRes = {
  count: number;
  eid: string;
  entry_url: string;
  bookmarks: {
    user: string;
    comment: string;
    timestamp: string;
    tags: string[];
  }[];
};
const Bookmarks: React.FC = () => {
  const [data, setData] = React.useState<APIRes | null>();

  React.useEffect(() => {
    (window as any).chrome.tabs.query(
      {
        active: true,
        windowId: (window as any).chrome.windows.WINDOW_ID_CURRENT,
      },
      function (tabs: any) {
        const url = encodeURIComponent(tabs[0].url);
        axios
          .get(`https://b.hatena.ne.jp/entry/jsonlite/?url=${url}`)
          .then((res: any) => setData(res.data));
      }
    );
  }, []);

  if (!data) {
    return <></>;
  }
  const now = new Date();
  const bookmarks: B[] = data.bookmarks.map((bookmark) => {
    const timestamp = new Date(bookmark.timestamp);
    const tlabel = timestampLabel(now, timestamp);
    let replyto = null;
    const body = bookmark.comment
      ? bookmark.comment.split(/(id:[a-zA-Z0-9_\-]+)/).map((token, i) => {
          if (token.indexOf("id:") === 0) {
            const id = token.slice(3);
            replyto = id;
            return (
              <a
                key={i}
                style={styles.replyto}
                href={`https://b.hatena.en.jp/${id}`}
              >
                {token}
              </a>
            );
          } else {
            return <span key={i}>{token}</span>;
          }
        })
      : null;
    return {
      ...bookmark,
      timestamp: { label: tlabel, date: timestamp },
      comment: body,
      replyto,
      children: [],
    };
  });
  const bookmarkByUser = bookmarks.reduce(
    (accum, bookmark) => ({ ...accum, [bookmark.user]: bookmark }),
    {} as { [id: string]: B }
  );
  const aggs = bookmarks.reduce((accum, bookmark) => {
    const replyToId = bookmark.replyto;
    if (replyToId) {
      const replyTo = bookmarkByUser[replyToId];
      replyTo?.children.push(bookmark);
      return accum;
    } else {
      return [...accum, bookmark];
    }
  }, [] as B[]);

  return (
    <div style={{ backgroundColor: "#f6f7f8", width: "480px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          height: "36px",
          borderBottom: "1px solid #ccc",
          position: "sticky",
          top: 0,
          backgroundColor: "#f6f7f8",
        }}
      >
        <a style={{ color: "#ff4166" }} href={data.entry_url}>
          {data.count} users
        </a>
        <span style={{ color: "rgba(70,82,94,.8)", fontSize: "14px" }}>
          <img src="https://b.st-hatena.com/626dd45717f5306ec18567a7989ec2e9a4e408bb/images/v4/public/entry/ic-comment.svg" />
          <span>{bookmarks.filter((b) => b.comment).length}</span>
        </span>
      </div>
      <ul style={{ ...styles.list } as any}>
        {aggs
          .filter((bookmark) => bookmark.comment)
          .map((bookmark) => {
            return (
              <li key={bookmark.user} style={styles.itemouter}>
                <BookmarkItem
                  bookmark={bookmark}
                  eid={data.eid}
                  key={bookmark.user}
                />
                {bookmark.children.map((child) => (
                  <BookmarkItem
                    bookmark={child}
                    eid={data.eid}
                    key={bookmark.user}
                  />
                ))}
              </li>
            );
          })}
      </ul>
      <ul style={styles.iconList as any}>
        {bookmarks
          .filter((b) => !b.comment)
          .map((b) => (
            <li key={b.user} style={styles.iconItem}>
              <img style={styles.usericon} src={iconUrl(b.user)} />
            </li>
          ))}
      </ul>
    </div>
  );
};

const BookmarkItem = ({ bookmark, eid }: { bookmark: B; eid: string }) => (
  <div key={bookmark.user} style={styles.iteminner}>
    <div style={styles.left as any}>
      <div
        style={bookmark.replyto ? styles.barToParent : styles.spaceToParent}
      ></div>
      <img style={styles.usericon} src={iconUrl(bookmark.user)} />
      {bookmark.children.length > 0 && <div style={styles.barToChild}></div>}
    </div>
    <div style={styles.right}>
      <div>
        <a
          href={`https://b.hatena.ne.jp/${bookmark.user}/`}
          style={styles.username}
        >
          {bookmark.user}
        </a>
        <time
          style={styles.timestamp}
          dateTime={bookmark.timestamp.date.toString()}
        >
          ・{bookmark.timestamp.label}
        </time>
      </div>
      <p style={styles.comment as any}>{bookmark.comment}</p>
      <div className="star-container">
        <h3 style={{ margin: 0 }}>
          <a
            href={`https://b.hatena.ne.jp/${bookmark.user}/${format(
              bookmark.timestamp.date,
              "yyyyMMdd"
            )}#bookmark-${eid}`}
          ></a>
        </h3>
      </div>
    </div>
  </div>
);

export default Bookmarks;
