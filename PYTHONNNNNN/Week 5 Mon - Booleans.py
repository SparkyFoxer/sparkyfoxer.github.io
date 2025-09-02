# 18/08/2025
# Boolean data type

IsAStudent=True
print(IsAStudent)
print(type(IsAStudent))
print(f"It is {IsAStudent} that you're a student")

# 1. 1==1 True correct
# 2. 1!=1 False correct
# 3. "sid"="sid" True correct
# 4. "mary"!="Mary" True correct
# 5. 4=="4" False correct
# 6. "cat"!="cat True correct
# 7. 456=456 True? it's a variable statement so neither correct
# 8. Yes==yes False correct
# 9. 900==900 True correct

# 1. 1<8 True correct
# 2. "cat"<"dog" True correct
# 3. 458<123 False correct
# 4. 456<"rabbit" False correct
# 5. "pig">"pig" False correct
# 6. 6789>12 True correct

# 1. 4<=6 True correct
# 2. 10<=10 True correct
# 3. 478>=478 True correct
# 4. 32>=32 True correct
# 5. "cat"!="cat" False correct
# 6. 45>10 True correct
# 7. 903<=903 True correct
# 8. 903<903 False correct
# 9. 903==903 True correct
#10. "july"="july" Neither correct

# REVISION TEST

FirstName="Sam"
print(f"Good morning {FirstName}")
User=input("What is your first name? ")
UserLast=input("What is your last name? ")
print(f"Good morning {User} {UserLast}, hope you're having a nice day!")
Lunch=input("What are you having for lunch? ")
print(f"Wow {User}, {Lunch} sounds delicious!")

# THIS WILL X A NUMBER GIVEN BY THE USER WITH AN ANSWER
Number1=float (input("What is your first number you want to multiply? "))
Number2=float (input("What is your second number you want to multiply? "))
Answer = Number1 * Number2
print(f"{Number1} x {Number2} = {Answer}")


#THIS WILL PRINT AGE AS AN INT
age=int (input("How old are you? "))
print(age)
print(type(age))

Name=input("What is your first name? ")
Movie=input("What is your fav movie? ")
Snack=input("What is your fav snack? ")
print(f"Hi {Name},\t\nYou said ur fav movie is {Movie}\t\t\n and that your fav snack is {Snack}")