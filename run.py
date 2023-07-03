from flask import Flask, render_template,request, jsonify, session, redirect
# from flask_wtf import FlaskForm
# from wtforms import StringField, SubmitField, TextAreaField
# from wtforms.validators import DataRequired
import os
from flask_fontawesome import FontAwesome
from datetime import datetime,timedelta
import re
from collections import defaultdict
import random
from collections import defaultdict
# from flask_simple_geoip import SimpleGeoIP

from utils import new_equation_generator


app = Flask(__name__)
fa = FontAwesome(app)

# app.permanent_session_lifetime = timedelta(hours=2)
app.secret_key='my_secret' # FIX



seed_equation_dict = {}

numble_score_distribution = {}


char_list = ['1','2','3','4','5','6','7','8','9','0','+','-','/','*']

def nextWordTime():
    today = datetime.now()

    # datetime.now()+timedelta(hours=23-today.hour,minutes = 59-today.minute,seconds = 60 - today.second)

    timeRemaining = f"{23-today.hour} hours and {59-today.minute} minutes"

    return timeRemaining




def generator():
    seed = session['today_seed']

    # today_word_count = session['today_seed']

    if seed in seed_equation_dict:
        print("GETTING CACHED VALUE")
        return seed_equation_dict[seed]['equation'],seed_equation_dict[seed]['value']

    print("CREATED EQUATION")

    final_true, eval_result = new_equation_generator(seed)

    seed_equation_dict[seed] = {'equation':final_true,'value':eval_result}

    return final_true,eval_result

def evaluator(inp):
    
    if len(inp)!=7:
        return False,'Invalid Length'
    
    for i in inp:
        if i not in char_list:
            return False,'Invalid Character'
    
    try:
        if eval(''.join(inp)) != getTruthAns():
            return False,'Equation Unsolved'
        # elif eval(''.join(inp)) == seed_equation_dict[getDayCount()-1]['value']:
        #     return False,'Yesterday\s Equation'
    except:
        return False,'Invalid Equation'
    
    return True,""

def getTruthValue():
    return generator()[0] # '2*35+11'

def getTruthAns():
    truth_st = getTruthValue()
    truth_ls = list(truth_st)
    truth_value = eval(''.join(truth_ls))
    return int(truth_value)


def checker(inp):

    truth_st = getTruthValue()
    truth_ls = list(truth_st)

    truth_dict = defaultdict(int)

    for i in truth_st:
        truth_dict[i]+=1


    # total_guesses = 0

    # while True:
    result_ls = []
    # inp = input()
#     inp = '20*3+20'

    eval_status,error_message = evaluator(inp)
    print(error_message)
    
    if  eval_status: # Remove this to perform regex to avoid code vulnerability
        
        for c,tup in enumerate(zip(inp,truth_ls)):
            i,j = tup
            if i==j:
                truth_dict[i]-=1
                result_ls.append((c,1,i))
                
        for c,tup in enumerate(zip(inp,truth_ls)):
            i,j = tup
            
            if i!=j and i in truth_ls:
                if truth_dict[i]>0:
                    truth_dict[i]-=1
                    result_ls.append((c,0,i))
                    
        test_ls = [i[0] for i in result_ls]
        for i in range(0,7):
            if i not in test_ls:
                result_ls.append((i,-1,inp[i]))
                    


    else:
        print(error_message)
        return result_ls,-1,error_message
        # print(error_message)
            
        
    session['total_guesses']+=1
    # total_guesses += 1
        
        
    if inp == truth_st:
        # print("CORRECT")
        

        return result_ls,1,""
        
    else:
        return result_ls,0,""


def getSeed():
    today = datetime.now()
    year,month,day,hour = str(today.year),str(today.month),str(today.day),str(today.hour)

    month = month if len(month)==2 else '0'+month
    day = day if len(day)==2 else '0'+day
    hour = hour if len(hour)==2 else '0'+hour


    seed = year+month+day
    # seed = year+month+day+str(today.minute)

    return seed


def getDayCount():
    start_date = datetime.strptime('Jan 31 2022', '%b %d %Y')
    cur_date = datetime.now()
    numble_word_count = (cur_date - start_date).days
    return numble_word_count


@app.route('/dark')
def dark():

    if 'dark_mode' in session:
        session['dark_mode'] = not session['dark_mode']
    else:
        session['dark_mode'] = True


    if session['generate']:
        return redirect('/mynumble/'+str(session['generate_key']))
    else:
        return redirect('/')

def getVarSeed(seed_str):
    try:
        return int(''.join([str(ord(i)%100) for i in seed_str]))
    except:
        return 97



@app.route('/mynumble/<var>')
@app.route('/mynumble/')
def indexSeed(var = ""):

    # print("HELLO")
    if len(var)==0:
        var = "a"
    var = var[0:6]
    
    seed = getVarSeed(var)
    # print(seed)
    # print(getTruthValue())
    
    new_session = True
    if 'last_played' in session and session['last_played'] == seed:
            # session.permanent = True
            new_session = False


    if new_session:
        session.permanent = True
        session['total_guesses'] = 0
        session['guess_history'] = []
        session['won_status'] = 0
        

    
    session['today_seed'] = seed


    if 'dark_mode' not in session:
        session['dark_mode'] = False

    session['generate'] = True
    session['generate_key'] = var


    history = []
    labels = []
    for i in session['guess_history']:
        temp = []
        temp_2 = []
        for j in i:
            temp.append(j[1])
            temp_2.append(j[2])
        history.append(temp)
        labels.append(temp_2)

    print(session['today_seed'])
    print(getTruthValue())
    print(session['total_guesses'])

    return render_template('index.html', answer_value = getTruthAns(),total = session['total_guesses'],history = history,labels =labels ,won_status = session["won_status"],numble_day_count = "#mynumble: "+var,global_remaining_time=nextWordTime(),dark_mode = session['dark_mode'])

def addScore(sc_int):
    try:
        if session['today_seed'] not in numble_score_distribution:
            numble_score_distribution[session['today_seed']] = [0]*7

        if sc_int ==-1:
            numble_score_distribution[session['today_seed']][-1]+=1
        else:
            numble_score_distribution[session['today_seed']][sc_int-1]+=1
    except:
        print("Problem adding global scores")
        pass

@app.route('/')
def index():
    
    # cur_version = 0.3
    # date_today = datetime.now().date
    # ip_address = request.remote_addr
    # print(request.remote_addr)

    # if ('version' not in session) or (session['version'] != cur_version):
    #     session.clear()


    # session.clear()
    
    seed = getSeed()
    print(seed)
    
    new_session = True
    if 'last_played' in session and session['last_played'] == seed:
            # session.permanent = True
            new_session = False

    

    # if 'total_guesses' not in session or 'guess_history' not in session or 'won_status' not in session:
        # session.permanent = True
    # session.clear()
    if new_session:
        session.permanent = True
        session['total_guesses'] = 0
        session['guess_history'] = []
        session['won_status'] = 0
        # session['version'] = cur_version
    
    session['today_seed'] = seed


    if 'dark_mode' not in session:
        session['dark_mode'] = False
    

    if 'scores' not in session:
        session['scores'] = defaultdict(int)

    session['generate'] = False

    # TESTING
    # session.clear()
    # session.permanent = True
    # session['total_guesses'] = 0
    # session['guess_history'] = []
    # session['won_status'] = -1
        
        # print(date_today)
        # session['date_today'] = date_today

    # print(session['guess_history'])
    history = []
    labels = []
    # all_labels = []
    for i in session['guess_history']:
        temp = []
        temp_2 = []
        for j in i:
            temp.append(j[1])
            temp_2.append(j[2])
        history.append(temp)
        labels.append(temp_2)
        # all_labels.extend(temp_2)



    # print(history)
    # print(labels)
    print(getTruthValue())
    print(session['total_guesses'])
    # print(session['scores'])

    return render_template('index.html', answer_value = getTruthAns(),total = session['total_guesses'],history = history,labels =labels ,won_status = session["won_status"],numble_day_count = "# "+str(getDayCount()),global_remaining_time=nextWordTime(),dark_mode = session['dark_mode'])

# @app.route('/getHistory',methods = ['GET'])
# def get_guess():
#     # print(session['total_guesses'])
#     # ls = [i[1] for i in sorted(session['guess_history'],key = lambda a: a[0])]
#     # print(session['guess_history'])

#     # return(session['total_guesses'])
#     return jsonify({'total':session['total_guesses'],'history':session['guess_history']})

@app.route('/getScores',methods = ['GET'])
def get_scores():
    score_distribution = [0]*7

    if 'scores' in session:
        for i in session['scores']:
            if session['scores'][i]==-1:
                score_distribution[-1]+=1
            else:
                score_distribution[session['scores'][i]-1] += 1

        
            
        return jsonify({'distribution':score_distribution,'played':len(session['scores']),'won':sum(score_distribution[0:-1])})
    else:
    
        return jsonify({'distribution':score_distribution,'played':0,'won':0})

@app.route('/getNumbleScores',methods = ['GET'])
def get_numble_scores():
    if 'today_seed' in session:
        cur_seed = session['today_seed']
    else:
        cur_seed = getSeed()

    if cur_seed not in numble_score_distribution:
        numble_score_distribution[cur_seed] = [0]*7

    temp_distrubution = numble_score_distribution[cur_seed]

    played,won = sum(temp_distrubution),sum(temp_distrubution[0:-1])
    
    if played > 0:
        numble_percent = list(map(lambda a:int((a/played)*100),temp_distrubution))
    else:
        numble_percent = [0]*7

    return jsonify(
        {'numble_distribution':temp_distrubution,
        'played':played,
        'won':won,
        'numble_percent':numble_percent
        })


@app.route('/submit', methods=['POST'])
def submit():
    # print(request.__dict__)
    if request.method == 'POST':
        # print("HERE ARE SENT GUESSES "+str(request.json['total_guesses']))
        # print("HERE ARE CURRENT GUESSES "+str(session['total_guesses']))

        if request.json['total_guesses']!=session['total_guesses']:
            return jsonify({'value': [],'ls':[],'labels':[],'next_word_time':nextWordTime(),'session_total':session['total_guesses']})



        # print(session['total_guesses'])
        inp = request.json['guess'][0:request.json['cur_count']]
        # print(request.json['guess'])
        # print(inp)

        # print(checker(inp))

        results = checker(inp)
        ls = [i[1] for i in sorted(results[0],key = lambda a: a[0])]
        label_ls = [i[2] for i in sorted(results[0],key = lambda a: a[0])]

        if results[1]!=-1:

            session['guess_history'].append([i for i in sorted(results[0],key = lambda a: a[0])])
            
            # print(session['guess_history'])

        if results[1]==1:
            session['won_status'] = results[1]

            # Stats
            if (not session['generate']) and ('scores' in session):
                session['scores'][session['today_seed']] = session['total_guesses']

                addScore(session['total_guesses'])
                # print(session['scores'])

        elif session['total_guesses']>=6:
            session['won_status'] = -1

            if (not session['generate']) and ('scores' in session):
                session['scores'][session['today_seed']] = -1

                addScore(-1)
                # print(session['scores'])

        # if session['won_status'] in [1,-1]:
        # today = datetime.now()
        # seed = getSeed()
        session['last_played']  = session['today_seed']
            
        

        # print(results[0])
        # print(seed_equation_dict)
        print(session['total_guesses'])
        

    return jsonify({'value': results[1],'ls':ls,'labels':label_ls,'next_word_time':nextWordTime(),'session_total':session['total_guesses'],'equation':getTruthValue()})


if __name__ == '__main__':
    # app.run()
    

    app.run(host = '0.0.0.0',debug=True,port = 5001) # FIX
