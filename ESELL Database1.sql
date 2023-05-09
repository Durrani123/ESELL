create table users(
	id serial primary key,
	username varchar(100) unique not null,
	name varchar(100) not null,
	password varchar (100) not null
)

select * from users;
create table categories(
	id serial primary key,
	name varchar(100)
)

insert into categories values
	(1,'Mobiles'),
	(2,'Sports'),
	(3,'Electronics'),
	(4,'Home Accessories')

create table products(
	id serial primary key,
	title varchar(100) not null,
	description varchar(800),
	price int not null,
	totalitems int not null,
	location varchar (300),
	category_id int,
	FOREIGN KEY (category_id) REFERENCES categories(id),
	user_id int,
	FOREIGN KEY (user_id) REFERENCES users(id)
)
select * from products;

CREATE TABLE images (
	id serial primary key,
  	data bytea,	
	product_id int,
	foreign key (product_id) references products(id)
)
select * from images;

create table cart(
	username varchar(100),
	FOREIGN KEY (username) REFERENCES users(username),
	product_id int,
	foreign key (product_id) references products(id),
	primary key(username,product_id)
)
select * from cart;

create table orders(
	id serial primary key,
	username varchar(100),
	FOREIGN KEY (username) REFERENCES users(username),
	product_id int,
	foreign key (product_id) references products(id)
)
select * from orders;
create table reviews(
	id serial primary key,
	review varchar(1000),
	title varchar(100),
	username varchar(100),
	FOREIGN KEY (username) REFERENCES users(username),
	product_id int,
	foreign key (product_id) references products(id),
  	dates DATE DEFAULT CURRENT_DATE
)
select * from reviews;

create table rating(
	rate int,
	username varchar(100),
	FOREIGN KEY (username) REFERENCES users(username),
	product_id int,
	foreign key (product_id) references products(id),
	primary key(username,product_id)
)
select *from rating;

truncate table rating;