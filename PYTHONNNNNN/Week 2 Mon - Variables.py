# Week 2 revision from last week
print("28/07/2025")
print("Hello world")
print('It\'s a nice day')
print('It\'s a \nnice day')

age = 20
Age = 200
print(age)
print(Age)
age = 100
print(age)
age = 106

# Can't start a veriable with a number however it can end with one
# _myAge will work but not good practice
# my-Age doesnt work beacuse the '-' is not valid

# Camel case: myVariableName = everything but the first is capatilized
# Pascal Case: MyVariableName = everything is capital
# Snake Case: my_variable_name = uses underscores to sperate words

User_Name = "BC"    # this is a string class (letters)
Calculate = 1000    # this is a integer class (numbers)
First_Name = "Brendan"
Get_User_Data = "Yes"
Price = 100.00      # this is a float class (numebers with a decimal)

print(type(User_Name)) # this will tell me what type of class this specific line is for 60-64
print(type(Calculate))
print(type(First_Name))
print(type(Get_User_Data))
print(type(Price))

FirstName = "Brendan"
print(FirstName)
print(type(FirstName))

x = str(3)    # x will be '3'
y = int(3)    # y will be 3
z = float(3)  # z will be 3.0

FullUsersName, AGE, FavFood, Salary = "Terry", 96, "Pasta", 196.33
print(FullUsersName)
print(AGE)
print(FavFood)
print(Salary)

FullUsersName = str(FullUsersName)
AGE = int(AGE)
FavFood = str(FavFood)
Salary = float(Salary)

studentID = "1234567890"
CellPhoneNumber = "123 456 7890"
#Just because something has numbers in it, doesnt mean it should be a str(string) | e.g someones ID number doesnt change so it should be a str. Same with someones phone number
