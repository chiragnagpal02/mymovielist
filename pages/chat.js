import { useContext, useEffect, useRef, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebaseConfig";
import { database } from "../firebaseConfig";
import {
  collection,
  orderBy,
  addDoc,
  query,
  serverTimestamp,
  limitToLast,
} from "firebase/firestore";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { classNames } from "../utilities";
import { GlobalContext } from "../context/GlobalState";
import Warning from "../components/Warning";
import Avatar from "../components/Avatar";

const Chat = () => {
  const [user] = useAuthState(auth);

  return (
    <section>
      {user ? (
        <ChatRoom />
      ) : (
        <Warning
          title="Authentication needed"
          description="To access this chat feature, you need to be signed in."
        />
      )}
    </section>
  );
};

function ChatRoom() {
  const { setToast, setErrorMsg, unknownError, setLoad } =
    useContext(GlobalContext);
  const dummy = useRef();
  const messagesRef = collection(database, "messages");
  const q = query(messagesRef, orderBy("createdAt"), limitToLast(25));
  const [messages, loading, error] = useCollectionData(q);
  useEffect(() => {
    setLoad(loading);
  }, [loading]);
  if (error) {
    unknownError();
    console.log(error);
  }
  const [formValue, setFormValue] = useState("");
  const sendMessage = async (e) => {
    e.preventDefault();
    if (formValue.trim() === "") {
      setErrorMsg("Error sending message", "Message cannot be empty.");
      setToast(true);
      setFormValue("");
      return;
    }
    setLoad(true);
    const { uid, photoURL, displayName } = auth.currentUser;
    try {
      await addDoc(messagesRef, {
        text: formValue,
        createdAt: serverTimestamp(),
        uid,
        photoURL,
        displayName,
      });
      dummy.current.scrollIntoView({ behavior: "smooth" });
    } catch (e) {
      unknownError();
      console.log(e);
    } finally {
      setFormValue("");
      setLoad(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div>
        {!loading &&
          messages.map((msg, idx) => <ChatMessage key={idx} message={msg} />)}
        <div ref={dummy}></div>
      </div>
      <form
        className="flex space-x-1 sm:space-x-3 items-center"
        onSubmit={sendMessage}
      >
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder="Say something nice"
          className="w-full rounded-md border border-gray-300 px-5 py-3 placeholder-gray-400 shadow-sm focus:border-cyber-purple focus:ring-1 focus:ring-cyber-purple"
        />
        <div className="rounded-md sm:flex-shrink-0">
          <button
            type="submit"
            className="inline-flex items-center rounded-full border border-transparent bg-cyber-purple p-3 text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-cyber-purple focus:ring-offset-2"
          >
            <PaperAirplaneIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}

function ChatMessage({ message }) {
  const { text, uid, photoURL, displayName } = message;
  const msgStatus = uid === auth.currentUser.uid ? "sent" : "received";

  return (
    <div
      className={classNames(
        msgStatus === "sent" && "flex-row-reverse",
        "flex text-center items-center"
      )}
    >
      <Avatar
        profileURL={photoURL}
        initials={displayName.charAt(0).toUpperCase()}
      />
      <p
        className={classNames(
          msgStatus === "sent" && "self-end",
          "bg-cyber-purple max-w-lg mb-3 leading-6 px-3 py-3 rounded-3xl relative text-center mx-1 my-1 text-white"
        )}
      >
        {text}
      </p>
    </div>
  );
}

export default Chat;
