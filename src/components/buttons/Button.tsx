import clsx from 'clsx';
import { MouseEventHandler, ReactNode } from 'react';

export default function Button(props: {
  className?: string;
  href?: string;
  imgUrl: string;
  onClick?: MouseEventHandler;
  title?: string;
  children: ReactNode;
}) {
  return (
    <a
      className={clsx(
        'button text-white shadow-solid text-sm pointer-events-auto',
        props.className,
      )}
      href={props.href}
      title={props.title}
      onClick={props.onClick}
    >
      <div className="inline-block bg-clay-700">
        <span>
          <div className="inline-flex h-full items-center gap-2">
            <img className="w-3 h-3 sm:w-[20px] sm:h-[20px]" src={props.imgUrl} />
            {props.children}
          </div>
        </span>
      </div>
    </a>
  );
}
